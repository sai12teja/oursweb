// Self-check for enquiry validation: `node api/_enquiry.check.mjs`
import assert from "node:assert/strict";
import { validateEnquiry, submitEnquiry } from "./_enquiry.js";

const good = { name: "Asha Rao", email: "asha@example.com", phone: "+91 98765 43210", service: "Web Solutions", message: "Hi" };
assert.equal(validateEnquiry(good).ok, true);
assert.equal(validateEnquiry({ ...good, phone: "" }).ok, true, "phone is optional");
assert.ok(validateEnquiry({ ...good, email: "nope" }).errors.email);
assert.ok(validateEnquiry({ ...good, name: "A" }).errors.name);
assert.ok(validateEnquiry({ ...good, phone: "call me" }).errors.phone);
assert.equal(validateEnquiry({ kind: "newsletter", email: "a@b.co" }).ok, true, "newsletter needs only an email");
assert.ok(validateEnquiry({ kind: "newsletter", email: "" }).errors.email);
assert.equal(validateEnquiry({ ...good, message: "x".repeat(9000) }).value.message.length, 5000, "message is capped");
assert.equal(validateEnquiry({ ...good, kind: "anything" }).value.kind, "contact", "unknown kind falls back");
assert.deepEqual(await submitEnquiry({ ...good, website: "http://spam" }), { ok: true }, "honeypot short-circuits");
assert.ok((await submitEnquiry({ email: "bad" })).errors, "invalid input never reaches storage");
console.log("enquiry checks passed");
