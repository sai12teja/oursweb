# Agentra — React + Vite

The Agentra AI-agency HTML template converted to a React + Vite SPA. All 19
pages are routed client-side; the original design is preserved verbatim and the
template's jQuery plugins (Swiper, GSAP, WOW, odometer, …) are reused as-is.

## Run

```bash
npm install
cp .env.example .env   # then fill in NVIDIA_API_KEY (and optionally MONGODB_URI)
npm run dev            # http://localhost:5173  (includes the /api/chat endpoint)
npm run build          # production build -> dist/
npm run preview        # preview the build (static only, no /api)
```

`npm run dev` runs a small middleware (see `vite.config.js`) that serves
`POST /api/chat` locally using the same code as the Vercel function, so the
chatbot works in dev without the Vercel CLI.

## Chatbot (NVIDIA + MongoDB)

A floating chat widget (bottom-right, on every page) talks to a server-side
proxy so the NVIDIA API key is **never exposed to the browser**.

```
ChatWidget.jsx  ──►  /api/chat  ──►  NVIDIA (integrate.api.nvidia.com)
                         └────────►  MongoDB (saves the conversation)
```

- `api/chat.js` — Vercel serverless endpoint.
- `api/_nvidia.js` — OpenAI-compatible call to NVIDIA (model from `NVIDIA_MODEL`).
- `api/_db.js` — MongoDB persistence. **Graceful**: with no `MONGODB_URI` the chat
  still works, it just doesn't save.
- `api/_chat-core.js` — shared logic used by both the Vercel function and dev middleware.

### Environment variables

| Var | Required | Purpose |
|-----|----------|---------|
| `NVIDIA_API_KEY` | yes | NVIDIA API key (from build.nvidia.com) |
| `NVIDIA_MODEL` | no | default `nvidia/nemotron-3.5-bolt-e4b` |
| `MONGODB_URI` | no | MongoDB connection string (enables persistence) |
| `MONGODB_DB` | no | database name, default `agentra` |

Local: put them in `.env` (gitignored). Production: set them in
**Vercel → Project → Settings → Environment Variables**.

### MongoDB setup (Atlas free tier)

1. Create a free cluster at https://www.mongodb.com/atlas.
2. Add a database user and allow network access (0.0.0.0/0 for a start).
3. Copy the connection string into `MONGODB_URI`.
Conversations are stored in the `conversations` collection, keyed by a
per-visitor id kept in `localStorage`.

### Deploy to Vercel

```bash
npm i -g vercel
vercel            # first time: link the project
vercel --prod     # deploy
```
Set the env vars in the Vercel dashboard (or `vercel env add`). The SPA
fallback + `/api` routing is handled by `vercel.json`.

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

`/` (home), `/about`, `/service`, `/pricing`, `/team`, `/faq`, `/contact`,
`/404`. Unknown paths render the 404 page.

Five template pages (projects, project details, blog list, blog article,
service details) are parked in `src/pages/_offline/`. They still contain
invented template content (clients, quotes, comments), so they are not routed
or bundled. To bring one back, replace its content, move it into
`src/pages/html/` and add its entry to `src/routes.js`.

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
