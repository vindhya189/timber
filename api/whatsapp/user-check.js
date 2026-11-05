
/**
 * Normalize Indian WhatsApp phone numbers.
 * Example:
 *  +91 8985836448
 *  918985836448
 *  8985836448
 * All become comparable formats.
 */
export function normalizePhoneNumber(number) {
  let digits = String(number || "").replace(/\D/g, "");

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (digits.length === 10) {
    digits = "91" + digits;
  }

  return digits;
}

/**
 * Find a registered TimberMart user
 * using profiles.phone or profiles.whatsapp_number.
 *
 * Pass the existing Supabase Admin client
 * from api/index.js.
 */
export async function findRegisteredUser(
  supabaseAdmin,
  incomingNumber
) {
  if (!supabaseAdmin) {
    throw new Error("Supabase Admin client is not available");
  }

  const normalizedNumber =
    normalizePhoneNumber(incomingNumber);

  if (!normalizedNumber || normalizedNumber.length < 10) {
    throw new Error("Invalid WhatsApp phone number");
  }

  const localNumber =
    normalizedNumber.startsWith("91") &&
    normalizedNumber.length === 12
      ? normalizedNumber.slice(2)
      : null;

  const possibleNumbers = new Set([
    normalizedNumber,
    `+${normalizedNumber}`,
  ]);

  if (localNumber) {
    possibleNumbers.add(localNumber);
    possibleNumbers.add(`+91${localNumber}`);
    possibleNumbers.add(`0${localNumber}`);
  }

  const filters = [];

  for (const number of possibleNumbers) {
    filters.push(`phone.eq.${number}`);
    filters.push(`whatsapp_number.eq.${number}`);
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id,name,role,phone,whatsapp_number,location")
    .or(filters.join(","))
    .limit(2);

  if (error) {
    console.error("TimberMart user lookup error:", error);
    throw new Error("Unable to check TimberMart registration");
  }

  if (!data || data.length === 0) {
    return {
      registered: false,
      user: null,
    };
  }

  if (data.length > 1) {
    console.error(
      "Multiple profiles found for WhatsApp number:",
      normalizedNumber
    );

    throw new Error(
      "Multiple TimberMart profiles match this WhatsApp number"
    );
  }

  return {
    registered: true,
    user: data[0],
  };
}
