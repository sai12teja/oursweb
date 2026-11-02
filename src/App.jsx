import { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { routes } from "./routes.js";
import Page from "./Page.jsx";
import ChatWidget from "./ChatWidget.jsx";
import { installLinkInterceptor } from "./agentra-init.js";

// Load every converted fragment as a raw string at build time.
const fragments = import.meta.glob("./pages/html/*.html", {
  query: "?raw",
  import: "default",
  eager: true,
});
const htmlByName = {};
for (const p in fragments) {
  const name = p.split("/").pop().replace(/\.html$/, "");
  htmlByName[name] = fragments[p];
}

export default function App() {
  const navigate = useNavigate();
  useEffect(() => installLinkInterceptor(navigate), [navigate]);

  return (
    <>
      <Routes>
        {routes.map((r) => (
          <Route
            key={r.path}
            path={r.path}
            element={<Page html={htmlByName[r.name]} title={r.title} />}
          />
        ))}
        <Route
          path="*"
          element={<Page html={htmlByName["404"]} title="404 - Agentra" />}
        />
      </Routes>
      <ChatWidget />
    </>
  );
}
