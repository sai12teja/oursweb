// Supabase storage. Graceful: if SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are
// not set, chat + booking still work — nothing is just saved. Schema lives in
// supabase/migrations/0001_agentra.sql.
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

// Contact-form messages and newsletter sign-ups (table: enquiries, migration 0002)
export async function saveEnquiry(e) {
  try {
    const s = db();
    if (!s) return { ok: false, reason: "no-storage" };
    const { error } = await s.from("enquiries").insert({
      kind: e.kind,
      name: e.name || null,
      email: e.email,
      phone: e.phone || null,
      service: e.service || null,
      message: e.message || null,
    });
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    console.error("supabase enquiry:", err.message);
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
