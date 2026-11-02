// Framework-agnostic chat logic, shared by the Vercel function (api/chat.js)
// and the Vite dev middleware (vite.config.js).
import { nvidiaChat } from "./_nvidia.js";
import { saveConversation } from "./_db.js";

const SYSTEM_PROMPT =
  "You are Agentra's friendly AI assistant on the Agentra website. Agentra is an " +
  "AI agency that helps brands grow with AI-driven marketing, automation, and " +
  "custom AI solutions. Answer briefly and helpfully. For questions about services, " +
  "pricing, or getting in touch, point visitors to the relevant page or the contact " +
  "form. Keep replies concise and on-brand.";

export async function runChat({ conversationId, messages }, { signal } = {}) {
  const clean = (messages || [])
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim()
    )
    .slice(-20) // cap context window
    .map((m) => ({ role: m.role, content: m.content }));

  if (!clean.length) throw new Error("No messages provided");

  const reply = await nvidiaChat(
    [{ role: "system", content: SYSTEM_PROMPT }, ...clean],
    { signal }
  );

  const full = [...clean, { role: "assistant", content: reply }];
  const persisted = conversationId
    ? await saveConversation(conversationId, full)
    : false;

  return { reply, persisted };
}
