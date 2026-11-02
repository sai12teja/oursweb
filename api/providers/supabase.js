// Supabase (Postgres) storage provider. Active when SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are set. Run the SQL in README to create the tables.
import { createClient } from "@supabase/supabase-js";

let client = null;
function db() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export async function saveAppointment(a) {
  try {
    const s = db();
    if (!s) return { ok: false, reason: "no-storage" };
    const { data, error } = await s
      .from("appointments")
      .insert({
        name: a.name,
        email: a.email,
        date: a.date,
        time: a.time,
        reason: a.reason,
        conversation_id: a.conversationId || null,
        status: "requested",
      })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: String(data.id) };
  } catch (e) {
    console.error("supabase appointment:", e.message);
    return { ok: false, reason: "error" };
  }
}
export async function listAppointments(limit = 50) {
  try {
    const s = db();
    if (!s) return [];
    const { data, error } = await s
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error("supabase list:", e.message);
    return [];
  }
}
export async function saveConversation(id, messages) {
  try {
    const s = db();
    if (!s) return false;
    const { error } = await s
      .from("conversations")
      .upsert({ id, messages, updated_at: new Date().toISOString() });
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("supabase conversation:", e.message);
    return false;
  }
}
export async function getConversation(id) {
  try {
    const s = db();
    if (!s) return null;
    const { data } = await s.from("conversations").select("*").eq("id", id).maybeSingle();
    return data || null;
  } catch (e) {
    return null;
  }
}
