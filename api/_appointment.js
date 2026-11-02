// Appointment booking: validate input, then persist to MongoDB.
import { saveAppointment } from "./_store.js";

export function validateAppointment(b) {
  const errors = {};
  const name = (b.name || "").trim();
  const email = (b.email || "").trim();
  const date = (b.date || "").trim();
  const time = (b.time || "").trim();
  const reason = (b.reason || "").trim();

  if (name.length < 2) errors.name = "Please enter your name.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    errors.email = "Enter a valid email, e.g. you@company.com.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.date = "Please pick a date.";
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const picked = new Date(date + "T00:00:00");
    if (isNaN(picked)) errors.date = "That date looks invalid.";
    else if (picked < today) errors.date = "Please pick today or a future date.";
  }
  if (!/^\d{2}:\d{2}$/.test(time)) errors.time = "Please pick a time.";

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: { name, email, date, time, reason },
  };
}

export async function bookAppointment(body, meta = {}) {
  const v = validateAppointment(body);
  if (!v.ok) return { ok: false, errors: v.errors };

  const saved = await saveAppointment({
    ...v.value,
    conversationId: meta.conversationId || body.conversationId || null,
  });
  if (!saved.ok) return { ok: false, reason: saved.reason || "error" };
  return { ok: true, id: saved.id, appointment: v.value };
}
