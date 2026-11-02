import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Dev-only middleware so `npm run dev` serves POST /api/chat using the same
// logic as the Vercel function. The NVIDIA key stays server-side (in process.env,
// loaded from .env) and is never shipped to the browser.
function devChatApi(env) {
  return {
    name: "dev-api-chat",
    configureServer(server) {
      Object.assign(process.env, env);
      server.middlewares.use("/api/chat", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          return res.end(JSON.stringify({ error: "Method not allowed" }));
        }
        let raw = "";
        req.on("data", (c) => (raw += c));
        req.on("end", async () => {
          res.setHeader("Content-Type", "application/json");
          try {
            const { runChat } = await import("./api/_chat-core.js");
            res.end(JSON.stringify(await runChat(JSON.parse(raw || "{}"))));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message || "Chat failed" }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ""); // all vars, unprefixed, server-side
  return {
    plugins: [react(), devChatApi(env)],
    server: { port: 5173, open: true },
  };
});
