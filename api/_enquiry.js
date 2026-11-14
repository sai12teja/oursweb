// Contact + newsletter enquiries: validate at the trust boundary, then persist.
import { saveEnquiry } from "./_store.js";

const clean = (v, max) => String(v ?? "").trim().slice(0, max);

export function validateEnquiry(b = {}) {
  const kind = b.kind === "newsletter" ? "newsletter" : "contact";
  const value = {
    kind,
    name: clean(b.name, 120),
    email: clean(b.email, 200),
    phone: clean(b.phone, 40),
    service: clean(b.service, 80),
    message: clean(b.message, 5000),
  };
  const errors = {};
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.email))
    errors.email = "Enter a valid email, e.g. you@company.com.";
  if (kind === "contact") {
    if (value.name.length < 2) errors.name = "Please enter your name.";
    if (value.phone && !/^[+\d][\d\s().-]{5,}$/.test(value.phone))
      errors.phone = "Enter a valid phone number, e.g. +91 98765 43210.";
  }
  return { ok: Object.keys(errors).length === 0, errors, value };
}

export async function submitEnquiry(body = {}) {
  // ponytail: honeypot only, no rate limit. Add one (Upstash / Vercel KV) when
  // spam gets past it. A filled honeypot is answered like a success on purpose.
  if (body.website) return { ok: true };

  const v = validateEnquiry(body);
  if (!v.ok) return { ok: false, errors: v.errors };

  const saved = await saveEnquiry(v.value);
  return saved.ok ? { ok: true } : { ok: false, reason: saved.reason || "error" };
}
