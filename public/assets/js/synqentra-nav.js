// SYNQENTRA navbar behaviour. Re-run per route by src/agentra-init.js (after
// main.js has cloned the mobile menu). Pairs with the NAVBAR block in
// assets/css/synqentra-brand.css.
(function () {
  var mqlDesktop = window.matchMedia("(min-width: 1200px)");

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

  // --- gliding indicator under the desktop links ---
  var nav = document.querySelector(".box-nav-menu");
  var pill = null;
  var links = [];
  var current = null;
  var navHovered = false;

  function ensurePill() {
    if (!nav || nav.offsetParent === null) return false; // hidden (hamburger)
    if (!pill) {
      pill = document.createElement("span");
      pill.className = "sq-nav-pill";
      pill.setAttribute("aria-hidden", "true");
      nav.appendChild(pill);
    }
    links = [].slice.call(nav.querySelectorAll(".menu-item > .item-link"));
    return links.length > 0;
  }
  function activeLink() {
    return (nav && nav.querySelector(".item-link.active")) || links[0];
  }
  function move(el) {
    if (!el || !pill) return;
    var r = el.getBoundingClientRect();
    if (!r.width) return;
    pill.style.width = r.width + "px";
    pill.style.transform =
      "translate(" + (r.left - nav.getBoundingClientRect().left) + "px, -50%)";
    pill.style.opacity = "1";
    current = el;
  }
  function initNav() {
    if (!mqlDesktop.matches || !ensurePill()) return;
    current = activeLink();
    requestAnimationFrame(function () { move(current); });
    links.forEach(function (l) {
      l.addEventListener("mouseenter", function () { move(l); });
    });
    nav.addEventListener("mouseenter", function () { navHovered = true; });
    nav.addEventListener("mouseleave", function () {
      navHovered = false;
      move(activeLink());
    });
  }

  // one throttled scroll handler: progress + keep the pill glued while the
  // header condenses (which shifts the links)
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      progress();
      if (pill && !navHovered) move(current || activeLink());
      ticking = false;
    });
  }
  function onResize() {
    if (mqlDesktop.matches && ensurePill()) move(activeLink());
    progress();
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

  // this file re-runs each route; drop the previous page's window handlers
  if (window.__sqNavScroll) window.removeEventListener("scroll", window.__sqNavScroll);
  if (window.__sqNavResize) window.removeEventListener("resize", window.__sqNavResize);
  window.__sqNavScroll = onScroll;
  window.__sqNavResize = onResize;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);

  initNav();
  progress();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      if (mqlDesktop.matches && ensurePill()) move(current || activeLink());
    });
  }
})();
