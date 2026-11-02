// MongoDB storage provider. Active when MONGODB_URI is set.
import { MongoClient } from "mongodb";

let clientPromise = null;
function cp() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (!clientPromise) clientPromise = new MongoClient(uri, { maxPoolSize: 5 }).connect();
  return clientPromise;
}
async function col(name) {
  const p = cp();
  if (!p) return null;
  const c = await p;
  return c.db(process.env.MONGODB_DB || "agentra").collection(name);
}

export async function saveAppointment(a) {
  try {
    const c = await col("appointments");
    if (!c) return { ok: false, reason: "no-storage" };
    const r = await c.insertOne({ ...a, status: "requested", createdAt: new Date() });
    return { ok: true, id: String(r.insertedId) };
  } catch (e) {
    console.error("mongo appointment:", e.message);
    return { ok: false, reason: "error" };
  }
}
export async function listAppointments(limit = 50) {
  try {
    const c = await col("appointments");
    if (!c) return [];
    return await c.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
  } catch (e) {
    console.error("mongo list:", e.message);
    return [];
  }
}
export async function saveConversation(id, messages) {
  try {
    const c = await col("conversations");
    if (!c) return false;
    await c.updateOne(
      { _id: id },
      { $set: { messages, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    return true;
  } catch (e) {
    console.error("mongo conversation:", e.message);
    return false;
  }
}
export async function getConversation(id) {
  try {
    const c = await col("conversations");
    if (!c) return null;
    return await c.findOne({ _id: id });
  } catch (e) {
    return null;
  }
}
