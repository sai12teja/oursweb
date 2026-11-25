// SYNQENTRA navbar behaviour. Re-run per route by src/agentra-init.js (after
// main.js has cloned the mobile menu). Pairs with the NAVBAR block in
// assets/css/synqentra-brand.css.
//
// The desktop active/hover highlight is pure CSS now (a cobalt underline), so
// this file only owns two things: the thin scroll-progress line across the top
// of the viewport, and the mobile sheet (adds a CTA + contact line, and closes
// the offcanvas on navigation). The scrolled/frosted bar state is the
// template's own `.header-sticky` toggle (assets/js/main.js).
(function () {
  // --- scroll-progress line (one element, kept across routes) ---
  var bar = document.querySelector(".sq-scrollbar");
  if (!bar) {
    bar = document.createElement("div");
    bar.className = "sq-scrollbar";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
  }
  function progress() {
    var el = document.documentElement;
    var max = el.scrollHeight - el.clientHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? el.scrollTop / max : 0) + ")";
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      progress();
      ticking = false;
    });
  }

  // --- mobile sheet: add a CTA + contact line, and close on navigate ---
  var bottom = document.querySelector(".pop-up-nav-mobile .canvas-bottom");
  if (bottom && !bottom.querySelector(".sq-mb-cta")) {
    bottom.insertAdjacentHTML(
      "beforeend",
      '<a href="contact.html" class="tf-btn style-big style-w-full sq-mb-cta" data-bs-dismiss="offcanvas">' +
        '<span class="text-btn">Request a Quote</span>' +
        '<span class="icon-btn"><i class="icon-chevron-right"></i></span>' +
        "</a>" +
        '<div class="sq-mb-contact">' +
        '<span class="sq-mb-dot"></span><span>Replies within a day</span>' +
        '<a href="mailto:hello@synqentra.com">hello@synqentra.com</a>' +
        "</div>"
    );
  }
  // SPA navigation leaves the offcanvas open otherwise
  var panel = document.getElementById("mobileMenu");
  if (panel && !panel.__sqBound) {
    panel.__sqBound = true;
    panel.addEventListener("click", function (e) {
      var a = e.target.closest("a[href]");
      if (!a || a.getAttribute("data-bs-toggle")) return;
      if (/^#/.test(a.getAttribute("href") || "")) return; // collapse toggles
      try {
        window.bootstrap.Offcanvas.getOrCreateInstance(panel).hide();
      } catch (err) {
        /* noop */
      }
    });
  }

  // this file re-runs each route; drop the previous page's window handler
  if (window.__sqNavScroll) window.removeEventListener("scroll", window.__sqNavScroll);
  window.__sqNavScroll = onScroll;
  window.addEventListener("scroll", onScroll, { passive: true });
  progress();
})();
