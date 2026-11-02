// Fallback when no storage is configured. Chat/booking still work; nothing is saved.
export async function saveAppointment() {
  return { ok: false, reason: "no-storage" };
}
export async function listAppointments() {
  return [];
}
export async function saveConversation() {
  return false;
}
export async function getConversation() {
  return null;
}
