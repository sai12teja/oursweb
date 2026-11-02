// Framework-agnostic chat logic, shared by the Vercel function (api/chat.js)
// and the Vite dev middleware (vite.config.js).
import { nvidiaChat } from "./_nvidia.js";
import { saveConversation } from "./_db.js";

const SERVICES_KB = `AGENTRA SERVICES (answer only from these facts):
- Intelligent Process Automation (IPA): streamline repetitive tasks and boost efficiency with intelligent, monitored workflows.
- AI SaaS Platform Development: design and build scalable AI SaaS products.
- Seamless System Integration: connect your existing platforms and tools with AI.
- Machine Learning: models that learn from your data for predictions and recommendations.
- Advanced Analytics & Reporting: turn business data into clear, actionable insight.
- Cloud-Based Operations: run data and workloads securely and at scale in the cloud.
- AI Chatbots & Assistants: assistants for support, sales and onboarding.
HOW WE WORK: Research & Planning -> AI Design & Development -> Deployment & Growth.`;

const SYSTEM_PROMPT =
  "You are Agentra's senior AI assistant on the Agentra website. Agentra is an AI " +
  "agency. Be warm, confident and concise, like an experienced solutions engineer. " +
  "Clear up visitor doubts about our services using ONLY the facts below, in plain " +
  "language with a concrete example when helpful. If you are asked something not " +
  "covered here (exact prices, timelines, team size, guarantees), say it is best " +
  "handled on a short call and invite them to book an appointment. NEVER invent " +
  "prices, numbers, guarantees or client names. When a visitor is interested or wants " +
  'to meet, invite them to book using the "Book appointment" button in this chat. ' +
  "Keep replies to a few sentences.\n\n" +
  SERVICES_KB;

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
