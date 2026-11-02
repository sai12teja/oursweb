import { useState, useRef, useEffect } from "react";
import "./chat-widget.css";

const GREETING = {
  role: "assistant",
  content: "Hi! I'm Agentra's AI assistant. Ask me anything about our services.",
};

function getConversationId() {
  try {
    let id = localStorage.getItem("agentra_chat_id");
    if (!id) {
      id = "conv_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("agentra_chat_id", id);
    }
    return id;
  } catch {
    return "conv_" + Date.now();
  }
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef(null);
  const convId = useRef(getConversationId());

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, open, loading]);

  async function send(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    // History sent to the server (drop the canned greeting).
    const history = messages.filter((m) => m !== GREETING);
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convId.current,
          messages: [...history, { role: "user", content: text }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry, something went wrong: " + err.message },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="agentra-chat">
      {open && (
        <div className="ac-panel" role="dialog" aria-label="Agentra chat">
          <div className="ac-header">
            <span className="ac-dot" />
            <div>
              <strong>Agentra Assistant</strong>
              <small>Powered by NVIDIA AI</small>
            </div>
            <button className="ac-close" aria-label="Close chat" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          <div className="ac-body" ref={bodyRef}>
            {messages.map((m, i) => (
              <div key={i} className={"ac-msg ac-" + m.role}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="ac-msg ac-assistant ac-typing">
                <span></span><span></span><span></span>
              </div>
            )}
          </div>

          <form className="ac-input" onSubmit={send}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              aria-label="Message"
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Send">
              ➤
            </button>
          </form>
        </div>
      )}

      <button
        className="ac-launcher"
        aria-label={open ? "Close chat" : "Open chat"}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "×" : "💬"}
      </button>
    </div>
  );
}
