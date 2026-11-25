import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

// A brand curtain that wipes over the viewport on each client-side navigation.
// It lives OUTSIDE #wrapper (the sticky header's containing block), so it never
// disturbs the header or the GSAP scroll triggers. It covers the instant the
// route swaps, holds briefly to mask the swap, then blinds up to reveal the
// fresh page. First paint and reduced-motion users get nothing.
export default function RouteTransition() {
  const { pathname } = useLocation();
  const first = useRef(true);
  const reduce = useRef(false);
  const [run, setRun] = useState(0);

  useEffect(() => {
    try {
      reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduce.current) return;
    setRun((n) => n + 1); // new key restarts the CSS animation
  }, [pathname]);

  if (run === 0) return null;

  return (
    <div className="sq-curtain" key={run} aria-hidden="true">
      <span className="sq-curtain-glyph">
        <svg viewBox="0 0 48 48" width="40" height="40" fill="none">
          <path
            d="M24 3l18 10.4v21.2L24 45 6 34.6V13.4L24 3z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M30 18.5c-1.5-2-3.6-3-6.2-3-3.4 0-5.8 1.8-5.8 4.4 0 2.4 1.8 3.5 5.4 4.2 3.9.8 5.9 2 5.9 4.6 0 2.8-2.6 4.8-6.4 4.8-3 0-5.3-1.2-6.7-3.4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </div>
  );
}
