// Re-runs the template's jQuery init against freshly-rendered page DOM on every
// route change, and intercepts internal .html links so they route client-side.
//
// The vendor libraries (jQuery, gsap, Swiper, WOW, …) load once in index.html.
// Only these three init files are content-dependent and must re-run per page:
const INIT_SCRIPTS = [
  "/assets/js/carousel.js",     // Swiper init (binds window "load")
  "/assets/js/gsapAnimation.js",// text / image parallax reveals
  "/assets/js/main.js",         // header sticky, counters, accordions, go-top, …
];

function loadScript(src) {
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = false; // keep execution order
    s.dataset.agentraInit = "1";
    s.onload = s.onerror = () => resolve();
    document.body.appendChild(s);
  });
}

export async function reinitAgentra() {
  const $ = window.jQuery;

  // ponytail: these three scripts are the ONLY code that binds jQuery window
  // scroll/resize handlers and GSAP ScrollTriggers, so a blanket teardown is
  // safe. If another plugin ever binds window.scroll, namespace this instead.
  if ($) $(window).off("scroll resize");
  if (window.ScrollTrigger && window.ScrollTrigger.getAll) {
    window.ScrollTrigger.getAll().forEach((t) => t.kill());
  }
  document
    .querySelectorAll("script[data-agentra-init]")
    .forEach((s) => s.remove());

  for (const src of INIT_SCRIPTS) await loadScript(src); // re-exec on fresh DOM

  if ($) $(window).trigger("load");          // triggers carousel.js swiper init
  try {
    if (window.WOW) new window.WOW().init();  // reveal this page's .wow elements
  } catch (e) {
    /* noop */
  }
}

// Turn the template's <a href="about.html"> links into SPA navigation.
export function installLinkInterceptor(navigate) {
  const handler = (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest("a[href]");
    if (!a || a.target === "_blank") return;
    const href = a.getAttribute("href") || "";
    const file = href.split("/").pop();
    if (!/\.html(\?|#|$)/.test(file)) return; // only internal .html links
    const name = file.replace(/[?#].*$/, "").replace(/\.html$/, "");
    e.preventDefault();
    navigate(name === "index" ? "/" : "/" + name);
  };
  document.addEventListener("click", handler);
  return () => document.removeEventListener("click", handler);
}
