// Pluggable storage. Picks ONE provider from env (set only the one you use):
//   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY            -> Supabase (Postgres)
//   FIREBASE_PROJECT_ID + CLIENT_EMAIL + PRIVATE_KEY    -> Firebase (Firestore)
//   MONGODB_URI                                         -> MongoDB
//   (none set)                                          -> no-op (nothing saved)
// Override with STORAGE_PROVIDER = supabase | firebase | mongo | none.

// Static import map so every provider is traced into the Vercel bundle.
const PROVIDERS = {
  supabase: () => import("./providers/supabase.js"),
  firebase: () => import("./providers/firebase.js"),
  mongo: () => import("./providers/mongo.js"),
  none: () => import("./providers/none.js"),
};

let impl = null;
let implName = null;

function pick() {
  const forced = (process.env.STORAGE_PROVIDER || "").toLowerCase();
  if (forced && PROVIDERS[forced]) return forced;
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return "supabase";
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  )
    return "firebase";
  if (process.env.MONGODB_URI) return "mongo";
  return "none";
}

async function provider() {
  if (impl) return impl;
  implName = pick();
  impl = await PROVIDERS[implName]();
  return impl;
}

export async function activeProvider() {
  await provider();
  return implName;
}
export async function saveAppointment(a) {
  return (await provider()).saveAppointment(a);
}
export async function listAppointments(limit) {
  return (await provider()).listAppointments(limit);
}
export async function saveConversation(id, messages) {
  return (await provider()).saveConversation(id, messages);
}
export async function getConversation(id) {
  return (await provider()).getConversation(id);
}
