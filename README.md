# Agentra — React + Vite

The Agentra AI-agency HTML template converted to a React + Vite SPA. All 19
pages are routed client-side; the original design is preserved verbatim and the
template's jQuery plugins (Swiper, GSAP, WOW, odometer, …) are reused as-is.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build -> dist/
npm run preview  # preview the build
```

## How it works

- `public/assets/` — the original CSS, JS, fonts and images, untouched.
- `index.html` — loads the vendor **libraries** once (jQuery, GSAP, Swiper, WOW…).
- `src/pages/html/*.html` — each page's body, auto-generated from the original
  HTML (scripts stripped, `assets/` paths made absolute).
- `src/routes.js` — route manifest (auto-generated).
- `src/Page.jsx` — injects a fragment and re-runs the plugin init for it.
- `src/agentra-init.js` — re-executes the three content-dependent init scripts
  (`carousel.js`, `gsapAnimation.js`, `main.js`) on every route change, and
  routes internal `*.html` links through React Router.

## Routes

`/` (home), `/index-2`, `/index-dark`, `/ai-startup`, `/ai-startup-dark`,
`/about`, `/service`, `/service-details`, `/project-1`, `/project-2`,
`/project-details`, `/team`, `/pricing`, `/blog-standard`, `/blog-details`,
`/contact`, `/faq`, `/404`, `/404-2`. Unknown paths render the 404 page.

## Re-generating pages

Edit the original `.html` files in the parent folder, then:

```bash
npm run convert
```

This rebuilds `src/pages/html/*` and `src/routes.js`.

## Note

Page content is injected as HTML (`dangerouslySetInnerHTML`) rather than rewritten
as hand-authored JSX — this keeps the design pixel-identical and reuses the
existing jQuery plugins instead of reimplementing them. To migrate a page to pure
JSX later, replace its entry in `src/pages/html/` with a real component.
