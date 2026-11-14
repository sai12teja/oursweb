import { useState, useRef, useEffect } from "react";
import "./chat-widget.css";

const GREETING = {
  role: "assistant",
  content:
    "Hi! I'm SYNQENTRA's assistant. Ask me about our AI services, or book a quick call.",
};

const QUICK = [
  { label: "Our services", text: "What services do you offer?" },
  { label: "How you work", text: "How do you work with clients?" },
  { label: "Book appointment", book: true },
];

const BLANK = { name: "", email: "", date: "", time: "", reason: "" };
const BOOK_RE = /\b(book|appointment|appoint|schedule|meeting|demo|call|consult)/i;

// minimal **bold** rendering; line breaks come from CSS white-space: pre-wrap
function fmt(text) {
  return String(text)
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      /^\*\*[^*]+\*\*$/.test(part) ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );
}

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

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [booking, setBooking] = useState(BLANK);
  const [bErr, setBErr] = useState({});
  const [bStatus, setBStatus] = useState("idle");
  const [teaser, setTeaser] = useState(false);
  const bodyRef = useRef(null);
  const convId = useRef(getConversationId());

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, open, loading, showForm]);

  // One nudge per browser session, a few seconds in. Never shown again once
  // it has been dismissed or the chat has been opened.
  useEffect(() => {
    let seen = true;
    try {
      seen = !!sessionStorage.getItem("sq_chat_teaser");
    } catch {
      /* storage blocked: stay quiet */
    }
    if (seen) return;
    const t = setTimeout(() => setTeaser(true), 9000);
    return () => clearTimeout(t);
  }, []);

  function dismissTeaser() {
    setTeaser(false);
    try {
      sessionStorage.setItem("sq_chat_teaser", "1");
    } catch {
      /* noop */
    }
  }

  function openBooking(note) {
    setMessages((m) => [
      ...m,
      { role: "assistant", content: note || "Sure — let's get you booked. Just fill in a few details below." },
    ]);
    setShowForm(true);
  }

  async function send(text) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    if (BOOK_RE.test(msg)) {
      setMessages((m) => [...m, { role: "user", content: msg }]);
      setInput("");
      openBooking();
      return;
    }

    const history = messages.filter((m) => m !== GREETING);
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convId.current,
          messages: [...history, { role: "user", content: msg }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, something went wrong: " + err.message }]);
    } finally {
      setLoading(false);
    }
  }

  async function submitBooking(e) {
    e.preventDefault();
    setBErr({});
    setBStatus("sending");
    try {
      const res = await fetch("/api/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...booking, conversationId: convId.current }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setShowForm(false);
        setBStatus("idle");
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: `✅ Booked! Your request for **${booking.date} at ${booking.time}** is saved. We'll confirm by email at ${booking.email}.`,
          },
        ]);
        setBooking(BLANK);
      } else if (data.errors) {
        setBErr(data.errors);
        setBStatus("idle");
      } else {
        setShowForm(false);
        setBStatus("idle");
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              "I couldn't save that just now — booking storage isn't set up yet. Please email us and we'll lock it in.",
          },
        ]);
      }
    } catch (err) {
      setBStatus("idle");
      setBErr({ form: "Network error — please try again." });
    }
  }

  const set = (k) => (e) => setBooking((b) => ({ ...b, [k]: e.target.value }));
  const showQuick = !showForm && messages.length <= 1 && !loading;

  return (
    <div className="agentra-chat">
      {open && (
        <div className="ac-panel" role="dialog" aria-label="SYNQENTRA chat">
          <div className="ac-header">
            <span className="ac-dot" />
            <div>
              <strong>SYNQENTRA Assistant</strong>
              <small>Services &amp; bookings</small>
            </div>
            <button
              className="ac-book"
              onClick={() => (showForm ? setShowForm(false) : openBooking())}
              aria-label="Book appointment"
            >
              {showForm ? "Back to chat" : "Book a call"}
            </button>
            <button className="ac-close" aria-label="Close chat" onClick={() => setOpen(false)}>
              <i className="icon-close" aria-hidden="true" />
            </button>
          </div>

          {!showForm ? (
            <>
              <div className="ac-body" ref={bodyRef}>
                {messages.map((m, i) => (
                  <div key={i} className={"ac-msg ac-" + m.role}>
                    {fmt(m.content)}
                  </div>
                ))}
                {loading && (
                  <div className="ac-msg ac-assistant ac-typing">
                    <span></span><span></span><span></span>
                  </div>
                )}
                {showQuick && (
                  <div className="ac-quick">
                    {QUICK.map((q) => (
                      <button key={q.label} onClick={() => (q.book ? openBooking() : send(q.text))}>
                        {q.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <form
                className="ac-input"
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about our services…"
                  aria-label="Message"
                />
                <button type="submit" disabled={loading || !input.trim()} aria-label="Send">
                  <i className="icon-send" aria-hidden="true" />
                </button>
              </form>
            </>
          ) : (
            <form className="ac-form" onSubmit={submitBooking}>
              <p className="ac-form__intro">Book a quick call with our team.</p>
              <label>
                Name
                <input value={booking.name} onChange={set("name")} aria-invalid={!!bErr.name} />
                {bErr.name && <small>{bErr.name}</small>}
              </label>
              <label>
                Email
                <input type="email" value={booking.email} onChange={set("email")} aria-invalid={!!bErr.email} />
                {bErr.email && <small>{bErr.email}</small>}
              </label>
              <div className="ac-form__row">
                <label>
                  Date
                  <input type="date" min={todayStr()} value={booking.date} onChange={set("date")} aria-invalid={!!bErr.date} />
                  {bErr.date && <small>{bErr.date}</small>}
                </label>
                <label>
                  Time
                  <input type="time" value={booking.time} onChange={set("time")} aria-invalid={!!bErr.time} />
                  {bErr.time && <small>{bErr.time}</small>}
                </label>
              </div>
              <label>
                What's it about? <span className="ac-opt">(optional)</span>
                <textarea rows="2" value={booking.reason} onChange={set("reason")} placeholder="e.g. automation for support" />
              </label>
              {bErr.form && <small className="ac-form__err">{bErr.form}</small>}
              <button type="submit" className="ac-form__submit" disabled={bStatus === "sending"}>
                {bStatus === "sending" ? "Booking…" : "Confirm appointment"}
              </button>
            </form>
          )}
        </div>
      )}

      {teaser && !open && (
        <div className="ac-teaser">
          <button
            className="ac-teaser__open"
            onClick={() => {
              setOpen(true);
              dismissTeaser();
            }}
          >
            Have a project in mind? Ask a question or book a call.
          </button>
          <button className="ac-teaser__close" aria-label="Dismiss" onClick={dismissTeaser}>
            <i className="icon-close" aria-hidden="true" />
          </button>
        </div>
      )}

      <button
        className="ac-launcher"
        aria-label={open ? "Close chat" : "Open chat"}
        onClick={() => {
          setOpen((o) => !o);
          dismissTeaser();
        }}
      >
        <i className={open ? "icon-close" : "icon-ai-chatbot"} aria-hidden="true" />
      </button>
    </div>
  );
}
