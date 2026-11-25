// Contact + newsletter forms. Page markup is injected as raw HTML, so the
// forms are handled by one delegated listener and posted to /api/enquiry.
const FALLBACK =
  "We couldn't send that just now. Please email hello@synqentra.com instead.";

function say(form, text, isError) {
  let el = form.querySelector(".sq-form-status");
  if (!el) {
    el = document.createElement("p");
    el.className = "sq-form-status";
    el.setAttribute("role", "status");
    (form.querySelector(".form-content") || form).appendChild(el);
  }
  el.classList.toggle("is-error", !!isError);
  el.textContent = text;
}

// A "Request a Quote" link inside a service card remembers which service it
// was, and the contact form opens with that service already selected.
export function prefillService() {
  let name = null;
  try {
    name = sessionStorage.getItem("sq_service");
    sessionStorage.removeItem("sq_service");
  } catch {
    return;
  }
  const select = name && document.querySelector('select[name="service"]');
  if (!select) return;
  const match = [...select.options].find((o) => o.textContent.trim() === name);
  if (match) select.value = match.value;
}

export function installFormHandler() {
  const onClick = (e) => {
    const link = e.target.closest?.('a[href$="contact.html"]');
    const card = link?.closest(".services-item, .services-item-2, .box-services-icon");
    const name = card?.querySelector(".name-item, .name-box")?.textContent.trim();
    if (!name) return;
    try {
      sessionStorage.setItem("sq_service", name);
    } catch {
      /* noop */
    }
  };

  const onSubmit = async (e) => {
    const form = e.target.closest?.("form.form-contact, form.form-newsletter");
    if (!form) return;
    e.preventDefault();
    if (form.dataset.sending) return;

    const val = (sel) => form.querySelector(sel)?.value || "";
    const isNewsletter = form.classList.contains("form-newsletter");
    const body = isNewsletter
      ? { kind: "newsletter", email: val('input[type="email"]') }
      : {
          kind: "contact",
          name: val('[name="name"]'),
          email: val('[name="email"]'),
          phone: val('[name="phone"]'),
          service: val('[name="service"]'),
          message: val('[name="mess"]'),
          website: val('[name="website"]'), // honeypot, empty for people
        };

    const button = form.querySelector('[type="submit"]');
    form.dataset.sending = "1";
    // clear any prior inline field errors
    form.querySelectorAll(".sq-invalid").forEach((f) => f.classList.remove("sq-invalid"));
    if (button) {
      button.disabled = true;
      button.classList.remove("is-success");
      button.classList.add("is-loading");
    }
    say(form, "Sending…");

    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        const msg = isNewsletter
          ? "Thanks — you're on the list."
          : "Thanks — your message is in. We'll reply by email with clear next steps.";
        form.reset();
        say(form, msg);
        if (button) {
          button.classList.remove("is-loading");
          button.classList.add("is-success");
          setTimeout(() => button.classList.remove("is-success"), 1900);
        }
        if (typeof window.sqToast === "function") window.sqToast(msg, { type: "success" });
      } else if (data.errors) {
        // mark each rejected field inline; clear on next keystroke
        Object.keys(data.errors).forEach((key) => {
          const field = form.querySelector('[name="' + key + '"]');
          if (!field) return;
          field.classList.add("sq-invalid");
          field.addEventListener(
            "input",
            () => field.classList.remove("sq-invalid"),
            { once: true }
          );
        });
        const first = Object.values(data.errors)[0];
        say(form, first, true);
        if (typeof window.sqToast === "function") window.sqToast(first, { type: "error" });
      } else {
        say(form, FALLBACK, true);
        if (typeof window.sqToast === "function") window.sqToast(FALLBACK, { type: "error" });
      }
    } catch {
      say(form, FALLBACK, true);
      if (typeof window.sqToast === "function") window.sqToast(FALLBACK, { type: "error" });
    } finally {
      delete form.dataset.sending;
      if (button) {
        button.disabled = false;
        button.classList.remove("is-loading");
      }
    }
  };

  document.addEventListener("submit", onSubmit);
  // capture phase: must run before the link interceptor navigates, because
  // React renders the next page (and its effects) as soon as that handler returns
  document.addEventListener("click", onClick, true);
  return () => {
    document.removeEventListener("submit", onSubmit);
    document.removeEventListener("click", onClick, true);
  };
}
