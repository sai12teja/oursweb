// Vercel serverless function: POST /api/chat
// Holds the NVIDIA key server-side and proxies to NVIDIA + MongoDB.
import { runChat } from "./_chat-core.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const result = await runChat(body);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message || "Chat failed" });
  }
}
