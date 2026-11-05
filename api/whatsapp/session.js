export async function getSession(supabase, phone) {
  const { data, error } = await supabase
    .from("whatsapp_sessions")
    .select("*")
    .eq("phone_number", phone)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function saveSession(supabase, phone, values) {
  const { error } = await supabase
    .from("whatsapp_sessions")
    .upsert(
      {
        phone_number: phone,
        ...values,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "phone_number" }
    );

  if (error) throw error;
}