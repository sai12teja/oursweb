// Small user-friendliness layer, kept separate from the template's own JS.
//  - installUx(): one-time delegated guards (stop dead "#" links jumping to top).
//  - remapLinks(): per-route, point the template's placeholder footer / contact
//    links at a real destination so nothing in the nav feels broken. Visible
//    text is never changed — only the href behind it.

// Footer/menu link text -> the closest real page it should open.
const LINK_TARGETS = {
  Stack: "service.html",
  Insights: "about.html",
  Portfolio: "team.html",
  "Privacy Policy": "contact.html",
  "Terms & Conditions": "contact.html",
  "Terms & Conditions ": "contact.html",
  Careers: "contact.html",
};

// Rewrite placeholder hrefs on the freshly-rendered page. Called on every route
// change from Page.jsx (after the markup is injected). The existing link
// interceptor then turns these .html targets into SPA navigation.
export function remapLinks() {
  document
    .querySelectorAll('.footer a[href="#"], .bottom-footer a[href="#"]')
    .forEach((a) => {
      const key = a.textContent.replace(/\s+/g, " ").trim();
      const target = LINK_TARGETS[key];
      if (target) a.setAttribute("href", target);
    });

  // Contact page: the "Get In Touch" heading sits above the email address —
  // make it actually start an email instead of jumping to the top.
  document.querySelectorAll('.contact-item a.title[href="#"]').forEach((a) => {
    a.setAttribute("href", "mailto:support@synqentra.com");
  });
}

// One delegated listener for the life of the app: any anchor still pointing at
// a bare "#" (decorative card titles, tag chips, brand logos the template left
// inert) must not scroll the page to the top when clicked.
export function installUx() {
  const onClick = (e) => {
    const a = e.target.closest?.('a[href="#"]');
    if (a) e.preventDefault();
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}
