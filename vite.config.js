import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Dev-only middleware so `npm run dev` serves the /api routes using the same
// logic as the Vercel functions. Secrets stay server-side (process.env, loaded
// from .env) and are never shipped to the browser.
function devApi(env) {
  const handlers = {
    "/api/chat": async (body) =>
      (await import("./api/_chat-core.js")).runChat(body),
    "/api/appointment": async (body) =>
      (await import("./api/_appointment.js")).bookAppointment(body, {
        conversationId: body.conversationId,
      }),
  };
  return {
    name: "dev-api",
    configureServer(server) {
      Object.assign(process.env, env);
      for (const [path, fn] of Object.entries(handlers)) {
        server.middlewares.use(path, (req, res) => {
          if (req.method !== "POST") {
            res.statusCode = 405;
            return res.end(JSON.stringify({ error: "Method not allowed" }));
          }
          let raw = "";
          req.on("data", (c) => (raw += c));
          req.on("end", async () => {
            res.setHeader("Content-Type", "application/json");
            try {
              const out = await fn(JSON.parse(raw || "{}"));
              if (out && out.ok === false && out.errors) res.statusCode = 400;
              res.end(JSON.stringify(out));
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message || "Request failed" }));
            }
          });
        });
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ""); // all vars, unprefixed, server-side
  return {
    plugins: [react(), devApi(env)],
    server: { port: 5173, open: true },
  };
});
