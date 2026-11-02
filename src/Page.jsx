import { useEffect } from "react";
import { reinitAgentra } from "./agentra-init.js";

// Renders one converted page fragment and (re)initializes the jQuery plugins
// against it. Markup is injected verbatim so the design stays pixel-identical.
export default function Page({ html, title }) {
  useEffect(() => {
    if (title) document.title = title;
    window.scrollTo(0, 0);
    reinitAgentra();
  }, [html, title]);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
