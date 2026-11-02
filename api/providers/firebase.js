// Firebase (Firestore) storage provider. Opt-in:
//   npm i firebase-admin
// and set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
// (from a service-account JSON; keep the \n escapes in the private key).
let dbRef = null;
let inited = false;

async function fs() {
  if (inited) return dbRef;
  inited = true;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) return (dbRef = null);
  privateKey = privateKey.replace(/\\n/g, "\n");
  const admin = (await import("firebase-admin")).default;
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
  }
  dbRef = admin.firestore();
  return dbRef;
}

export async function saveAppointment(a) {
  try {
    const d = await fs();
    if (!d) return { ok: false, reason: "no-storage" };
    const ref = await d.collection("appointments").add({ ...a, status: "requested", createdAt: new Date() });
    return { ok: true, id: ref.id };
  } catch (e) {
    console.error("firebase appointment:", e.message);
    return { ok: false, reason: "error" };
  }
}
export async function listAppointments(limit = 50) {
  try {
    const d = await fs();
    if (!d) return [];
    const snap = await d.collection("appointments").orderBy("createdAt", "desc").limit(limit).get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("firebase list:", e.message);
    return [];
  }
}
export async function saveConversation(id, messages) {
  try {
    const d = await fs();
    if (!d) return false;
    await d.collection("conversations").doc(id).set({ messages, updatedAt: new Date() }, { merge: true });
    return true;
  } catch (e) {
    console.error("firebase conversation:", e.message);
    return false;
  }
}
export async function getConversation(id) {
  try {
    const d = await fs();
    if (!d) return null;
    const doc = await d.collection("conversations").doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  } catch (e) {
    return null;
  }
}
