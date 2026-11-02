// MongoDB persistence for chat conversations.
// Graceful: if MONGODB_URI is not set (or the DB is unreachable), the chatbot
// still works — it just skips saving. The connection is cached across
// serverless invocations to avoid exhausting connections.
import { MongoClient } from "mongodb";

let clientPromise = null;

function getClientPromise() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (!clientPromise) {
    clientPromise = new MongoClient(uri, { maxPoolSize: 5 }).connect();
  }
  return clientPromise;
}

async function collection(name = "conversations") {
  const cp = getClientPromise();
  if (!cp) return null;
  const client = await cp;
  return client.db(process.env.MONGODB_DB || "agentra").collection(name);
}

export async function saveConversation(conversationId, messages) {
  try {
    const col = await collection();
    if (!col) return false;
    await col.updateOne(
      { _id: conversationId },
      {
        $set: { messages, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    return true;
  } catch (e) {
    console.error("Mongo save failed:", e.message); // never break chat on persistence error
    return false;
  }
}

export async function getConversation(conversationId) {
  try {
    const col = await collection();
    if (!col) return null;
    return await col.findOne({ _id: conversationId });
  } catch (e) {
    console.error("Mongo read failed:", e.message);
    return null;
  }
}

// Appointments ------------------------------------------------------------
export async function saveAppointment(appt) {
  try {
    const col = await collection("appointments");
    if (!col) return { ok: false, reason: "no-storage" };
    const doc = { ...appt, status: "requested", createdAt: new Date() };
    const res = await col.insertOne(doc);
    return { ok: true, id: String(res.insertedId) };
  } catch (e) {
    console.error("Mongo appointment save failed:", e.message);
    return { ok: false, reason: "error", error: e.message };
  }
}

export async function listAppointments(limit = 50) {
  try {
    const col = await collection("appointments");
    if (!col) return [];
    return await col.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
  } catch (e) {
    console.error("Mongo appointment list failed:", e.message);
    return [];
  }
}
