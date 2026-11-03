
 // TimberMart WhatsApp Flow endpoint — Supabase Edge Function
import { createClient } from "npm:@supabase/supabase-js@2";

type FlowRequest = {
  encrypted_flow_data: string;
  encrypted_aes_key: string;
  initial_vector: string;
};

type FlowBody = {
  action?: string;
  screen?: string;
  flow_token?: string;
  version?: string;
  data?: Record<string, unknown>;
};

const SUPABASE_URL = Deno.env.get("PROJECT_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
const FLOW_PRIVATE_KEY = Deno.env.get("FLOW_PRIVATE_KEY")!;

const supabase = createClient(
  PROJECT_URL,
  SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function privateKeyBytes(pem: string): Uint8Array {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  return fromBase64(base64);
}

async function decryptRequest(payload: FlowRequest) {
  const rsaKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes(FLOW_PRIVATE_KEY),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"],
  );

  const aesKey = new Uint8Array(
    await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      rsaKey,
      fromBase64(payload.encrypted_aes_key),
    ),
  );

  const iv = fromBase64(payload.initial_vector);
  const aesCryptoKey = await crypto.subtle.importKey(
    "raw",
    aesKey,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    aesCryptoKey,
    fromBase64(payload.encrypted_flow_data),
  );

  return {
    body: JSON.parse(new TextDecoder().decode(plaintext)) as FlowBody,
    aesKey,
    iv,
  };
}

async function encryptResponse(
  response: Record<string, unknown>,
  aesKey: Uint8Array,
  iv: Uint8Array,
): Promise<string> {
  // Meta Flow response IV: bitwise-invert every request IV byte.
  const responseIv = new Uint8Array(iv.map((byte) => (~byte) & 0xff));
  const key = await crypto.subtle.importKey(
    "raw",
    aesKey,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: responseIv, tagLength: 128 },
    key,
    new TextEncoder().encode(JSON.stringify(response)),
  );

  return toBase64(new Uint8Array(encrypted));
}

function str(value: unknown, max = 2000): string {
  if (value === null || value === undefined) return "";
  return String(value).trim().slice(0, max);
}

function numberOrNull(value: unknown): number | null {
  const text = str(value, 100);
  if (!text) return null;
  const result = Number(text);
  return Number.isFinite(result) ? result : null;
}

async function saveRequirement(
  flowToken: string,
  data: Record<string, unknown>,
) {
  const category = str(data.category, 80);
  const species = str(data.species, 100);
  const village = str(data.village, 150);
  const quantity = numberOrNull(data.quantity);

  if (!category || !species || !village) {
    throw new Error("Category, species and village are required.");
  }
  if (quantity === null || quantity <= 0) {
    throw new Error("Quantity must be greater than zero.");
  }

  const girthMin = numberOrNull(data.girth_min);
  const girthMax = numberOrNull(data.girth_max);
  const budget = numberOrNull(data.budget);
  const latitude = numberOrNull(data.latitude);
  const longitude = numberOrNull(data.longitude);

  if (girthMin !== null && girthMin < 0) throw new Error("Invalid minimum girth.");
  if (girthMax !== null && girthMax < 0) throw new Error("Invalid maximum girth.");
  if (girthMin !== null && girthMax !== null && girthMin > girthMax) {
    throw new Error("Minimum girth cannot exceed maximum girth.");
  }
  if (budget !== null && budget < 0) throw new Error("Invalid budget.");
  if (latitude !== null && (latitude < -90 || latitude > 90)) {
    throw new Error("Invalid latitude.");
  }
  if (longitude !== null && (longitude < -180 || longitude > 180)) {
    throw new Error("Invalid longitude.");
  }

  const row = {
    requirement_id: `TM-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`,
    flow_token: flowToken,
    category,
    species,
    other_species: str(data.other_species, 100) || null,
    quantity,
    unit: str(data.unit, 40) || "pieces",
    girth_min: girthMin,
    girth_max: girthMax,
    length: str(data.length, 100) || null,
    description: str(data.description, 1000) || null,
    budget,
    village,
    pincode: str(data.pincode, 12) || null,
    digipin: str(data.digipin, 32) || null,
    latitude,
    longitude,
    status: "new",
  };

  const { data: inserted, error } = await supabase
    .from("whatsapp_flow_requirements")
    .insert(row)
    .select("requirement_id")
    .single();

  if (!error && inserted) return inserted;

  // A retry with the same flow token should not duplicate a requirement.
  if (error?.code === "23505") {
    const { data: existing, error: lookupError } = await supabase
      .from("whatsapp_flow_requirements")
      .select("requirement_id")
      .eq("flow_token", flowToken)
      .maybeSingle();

    if (!lookupError && existing) return existing;
  }

  console.error("Supabase insert failed:", error?.code ?? "unknown");
  throw new Error("Could not save requirement.");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let payload: FlowRequest;
  try {
    payload = await req.json();
    if (
      !payload.encrypted_flow_data ||
      !payload.encrypted_aes_key ||
      !payload.initial_vector
    ) {
      return new Response("Invalid encrypted Flow payload", { status: 400 });
    }
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  let decrypted: Awaited<ReturnType<typeof decryptRequest>>;
  try {
    decrypted = await decryptRequest(payload);
  } catch (error) {
    console.error(
      "Flow decryption failed:",
      error instanceof Error ? error.message : "unknown",
    );
    return new Response("Unable to decrypt Flow request", { status: 421 });
  }

  try {
    const body = decrypted.body;
    let response: Record<string, unknown>;

    if (body.action === "ping") {
      response = { data: { status: "active" } };
    } else if (body.action === "INIT") {
      response = { screen: "WELCOME", data: {} };
    } else if (body.action === "BACK") {
      response = { screen: body.screen || "WELCOME", data: body.data || {} };
    } else if (body.action === "data_exchange") {
      const data = body.data || {};

      if (str(data.action, 80) !== "submit_requirement") {
        throw new Error("Unsupported data_exchange action.");
      }

      const flowToken = str(body.flow_token, 300);
      if (!flowToken) throw new Error("Missing flow_token.");

      const saved = await saveRequirement(flowToken, data);
      response = {
        screen: "SUCCESS",
        data: {
          requirement_id: saved.requirement_id,
          message: "Your TimberMart requirement was submitted successfully.",
        },
      };
    } else {
      throw new Error(`Unsupported action: ${str(body.action, 80)}`);
    }

    const encryptedResponse = await encryptResponse(
      response,
      decrypted.aesKey,
      decrypted.iv,
    );

    return new Response(encryptedResponse, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "Flow action failed:",
      error instanceof Error ? error.message : "unknown",
    );
    return new Response("Flow endpoint failed", { status: 500 });
  }
});
