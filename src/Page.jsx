import { useEffect, useRef } from "react";
import { reinitAgentra } from "./agentra-init.js";
import { prefillService } from "./forms.js";
import { remapLinks } from "./ux.js";

// Renders one converted page fragment and (re)initializes the jQuery plugins
// against it. Markup is injected verbatim so the design stays pixel-identical.
export default function Page({ html, title }) {
  const ref = useRef(null);

  useEffect(() => {
    if (title) document.title = title;
    window.scrollTo(0, 0);
    reinitAgentra();
    prefillService();
    remapLinks();

    // Replay the content entrance (fade + rise of everything under #wrapper
    // except the sticky header — CSS section 13). Toggling the class and
    // forcing a reflow restarts the animation on every route.
    const el = ref.current;
    if (el) {
      el.classList.remove("sq-in");
      void el.offsetWidth;
      el.classList.add("sq-in");
    }
  }, [html, title]);

  return (
    <div
      ref={ref}
      className="sq-page sq-in"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
