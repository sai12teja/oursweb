// NVIDIA chat call (OpenAI-compatible). Key read from env, server-side only.
const BASE = "https://integrate.api.nvidia.com/v1";

export async function nvidiaChat(messages, { signal } = {}) {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) throw new Error("NVIDIA_API_KEY is not set");
  const model = process.env.NVIDIA_MODEL || "nvidia/nemotron-3.5-bolt-e4b";

  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 512 }),
    signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`NVIDIA ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || "").trim();
}
