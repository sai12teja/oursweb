// SYNQENTRA UI enhancer. Re-run on every route change by src/agentra-init.js.
// Pairs with assets/css/synqentra-premium.css. Kept intentionally small:
// its only job now is the brand toast stack used by src/forms.js. (Earlier
// experiments — Popover tooltips and native scroll-driven reveals — were
// removed because they added risk without clearly improving the design.)
(function () {
  if (window.sqToast) return; // bind once; the region persists across routes

  var region = null;
  window.sqToast = function (message, opts) {
    opts = opts || {};
    if (!region || !document.body.contains(region)) {
      region = document.querySelector(".sq-toast-region");
      if (!region) {
        region = document.createElement("div");
        region.className = "sq-toast-region";
        region.setAttribute("role", "status");
        region.setAttribute("aria-live", "polite");
        document.body.appendChild(region);
      }
    }
    var t = document.createElement("div");
    t.className = "sq-toast" + (opts.type ? " is-" + opts.type : "");
    t.textContent = message;
    region.appendChild(t);
    var remove = function () {
      t.classList.add("is-leaving");
      t.addEventListener("animationend", function () {
        t.remove();
      });
    };
    setTimeout(remove, opts.duration || 4200);
    return t;
  };
})();
