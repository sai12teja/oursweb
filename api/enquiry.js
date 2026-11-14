// Vercel serverless function: POST /api/enquiry (contact form + newsletter)
import { submitEnquiry } from "./_enquiry.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const result = await submitEnquiry(body);
    const status = result.ok ? 200 : result.errors ? 400 : 503;
    res.status(status).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message || "Could not send" });
  }
}
