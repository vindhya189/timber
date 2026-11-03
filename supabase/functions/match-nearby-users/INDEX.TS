import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("PROJECT_URL") ?? Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseUrl || !serviceKey) throw new Error("Missing PROJECT_URL/SERVICE_ROLE_KEY Edge Function secrets");

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function distanceKm(lat1:number, lon1:number, lat2:number, lon2:number) {
  const rad = (v:number) => v * Math.PI / 180;
  const dLat = rad(lat2-lat1), dLon = rad(lon2-lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(rad(lat1))*Math.cos(rad(lat2))*Math.sin(dLon/2)**2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function normalize(v: unknown) { return String(v ?? "").trim().toLowerCase(); }

// Configure DIGIPIN_RESOLVER_URL to a verified service you control which accepts
// { digipin } and returns { latitude, longitude }. Do not trust client-supplied
// coordinates without validating them against the DIGIPIN.
async function resolveDigipin(digipin: string, suppliedLat: unknown, suppliedLon: unknown) {
  const resolver = Deno.env.get("DIGIPIN_RESOLVER_URL");
  if (resolver) {
    const r = await fetch(resolver, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(Deno.env.get("DIGIPIN_RESOLVER_TOKEN") ? { "Authorization": `Bearer ${Deno.env.get("DIGIPIN_RESOLVER_TOKEN")}` } : {}) },
      body: JSON.stringify({ digipin }),
    });
    if (!r.ok) throw new Error("DIGIPIN resolver rejected the code");
    const v = await r.json();
    if (typeof v.latitude === "number" && typeof v.longitude === "number") return { latitude: v.latitude, longitude: v.longitude };
    throw new Error("DIGIPIN resolver response must include numeric latitude and longitude");
  }
  // Temporary development fallback only. A real resolver is required for production.
  const latitude = Number(suppliedLat), longitude = Number(suppliedLon);
  if (Number.isFinite(latitude) && Number.isFinite(longitude) &&
      Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) return { latitude, longitude };
  throw new Error("No DIGIPIN resolver configured. Set DIGIPIN_RESOLVER_URL or provide verified coordinates during development.");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  try {
    const body = await req.json();
    // Protect this public endpoint before production: use a signed MSG91 callback,
    // a shared server-side token, or verify the WhatsApp Flow request at the edge.
    const required = ["full_name", "user_role", "selected_action", "digipin", "timber_category", "wood_species"];
    for (const k of required) if (!String(body[k] ?? "").trim()) return json({ error: `Missing ${k}` }, 400);

    const coords = await resolveDigipin(String(body.digipin).trim(), body.latitude, body.longitude);
    const { data: reqRow, error: insertErr } = await supabase.from("tm_timber_requirements").insert({
      submitter_phone: String(body.whatsapp_mobile_number ?? ""),
      submitter_role: String(body.user_role),
      action: String(body.selected_action),
      timber_species: String(body.wood_species),
      timber_category: String(body.timber_category),
      description: String(body.description ?? ""),
      digipin: String(body.digipin),
      latitude: coords.latitude,
      longitude: coords.longitude,
      quantity: body.quantity ? Number(body.quantity) : null,
      unit: String(body.unit ?? ""),
      budget_inr: body.budget_inr ? Number(body.budget_inr) : null,
      village_or_town: String(body.village_or_town ?? ""),
      district: String(body.district ?? ""),
      state: String(body.state ?? ""),
      source_payload: body,
    }).select("id").single();
    if (insertErr) throw insertErr;

    const { data: users, error: usersErr } = await supabase.from("tm_marketplace_users")
      .select("id,full_name,whatsapp_number,role,latitude,longitude,timber_species,timber_categories,interested_roles,whatsapp_opt_in,is_active")
      .eq("is_active", true)
      .eq("whatsapp_opt_in", true);
    if (usersErr) throw usersErr;

    const species = normalize(body.wood_species), category = normalize(body.timber_category);
    const submitterPhone = normalize(body.whatsapp_mobile_number);
    const candidates = (users ?? []).filter((u:any) => {
      if (normalize(u.whatsapp_number) === submitterPhone) return false;
      const km = distanceKm(coords.latitude, coords.longitude, Number(u.latitude), Number(u.longitude));
      if (!Number.isFinite(km) || km > 40) return false;
      const speciesList = (u.timber_species ?? []).map(normalize);
      const categoryList = (u.timber_categories ?? []).map(normalize);
      const roleList = (u.interested_roles ?? []).map(normalize);
      const roleMatches = roleList.length === 0 || roleList.includes(normalize(body.user_role)) ||
        roleList.includes(normalize(body.selected_action));
      const woodMatches = speciesList.length === 0 || speciesList.includes(species) ||
        categoryList.includes(category);
      return roleMatches && woodMatches;
    });

    const queueRows = candidates.map((u:any) => ({
      requirement_id: reqRow.id,
      recipient_user_id: u.id,
      recipient_phone: u.whatsapp_number,
      distance_km: Number(distanceKm(coords.latitude, coords.longitude, Number(u.latitude), Number(u.longitude)).toFixed(2)),
      match_reason: `Within 40 km; role/action and timber species/category match`,
      status: "queued",
    }));
    if (queueRows.length) {
      const { error: qErr } = await supabase.from("tm_notification_queue").upsert(queueRows, { onConflict: "requirement_id,recipient_user_id", ignoreDuplicates: true });
      if (qErr) throw qErr;
    }

    // Queueing is not the same as sending. Connect this queue to MSG91's current
    // WhatsApp API/template format in a separate sender function before claiming delivery.
    return json({
      success: true,
      requirement_id: reqRow.id,
      matched_users: candidates.length,
      queued_notifications: queueRows.length,
      message: "Requirement saved and matching opted-in users queued. MSG91 delivery requires the sender integration to be configured.",
    });
  } catch (e) {
    console.error("match-nearby-users error", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
