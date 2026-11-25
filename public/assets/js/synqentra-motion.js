// SYNQENTRA motion layer. Re-run on every route change by src/agentra-init.js,
// which kills all ScrollTriggers first. Pairs with section 6 of
// assets/css/synqentra-brand.css; heading reveals live in gsapAnimation.js.
(function () {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    if (window.__sqMM) window.__sqMM.revert();
    var mm = (window.__sqMM = gsap.matchMedia());

    mm.add(
        {
            desktop: "(min-width: 992px)",
            motion: "(prefers-reduced-motion: no-preference)",
        },
        function (ctx) {
            if (!ctx.conditions.motion) return;
            var desktop = ctx.conditions.desktop;

            // Card grids rise in as a staggered group. Left alone: anything the
            // template already reveals (tf-animate / wow), Swiper slides, and
            // cards already on screen (hiding those would make them blink).
            var cards = gsap.utils
                .toArray(
                    ".box-services-icon, .pricing-item, .team-card, .post-grid, .services-item, .services-item-2, .counter-item"
                )
                .filter(function (el) {
                    return (
                        !el.closest(".swiper, .wow, [class*='tf-animate']") &&
                        el.getBoundingClientRect().top > window.innerHeight
                    );
                });

            if (cards.length) {
                gsap.set(cards, { autoAlpha: 0, y: desktop ? 40 : 20 });
                ScrollTrigger.batch(cards, {
                    start: "top 90%",
                    once: true,
                    onEnter: function (els) {
                        gsap.to(els, {
                            autoAlpha: 1,
                            y: 0,
                            duration: 0.8,
                            ease: "power3.out",
                            stagger: desktop ? 0.09 : 0.05,
                            overwrite: true,
                            // hand transform back to CSS so hover lifts work
                            clearProps: "transform",
                        });
                    },
                });
            }

            // Scroll-linked depth, desktop only: tween one number per section
            // (--sq-p, 0 → 1) and let CSS decide what moves and how far.
            if (desktop) {
                var link = function (selector, start, end) {
                    gsap.utils.toArray(selector).forEach(function (el) {
                        gsap.fromTo(
                            el,
                            { "--sq-p": 0 },
                            {
                                "--sq-p": 1,
                                ease: "none",
                                scrollTrigger: { trigger: el, start: start, end: end, scrub: 1 },
                            }
                        );
                    });
                };
                link(".wg-hero-area", "top top", "bottom top");
                link(".footer", "top bottom", "bottom bottom");

                // Each section's content rises into place as you scroll it in —
                // motion tied to scroll position, not a one-off reveal. It starts
                // 60px low and settles at 0 by the time the section is well in
                // view, so it only ever moves up and never collides with a
                // neighbour. Hero, footer and marquee strips keep their own motion.
                gsap.utils.toArray("#wrapper section").forEach(function (sec) {
                    if (sec.matches(".wg-hero-area, .section-marquee")) return;
                    if (sec.querySelector(".infiniteSlide-app")) return; // marquee-bearing
                    var content = sec.querySelector(":scope > .container");
                    if (!content) return;
                    // gsap.set holds the low start until the trigger runs, so the
                    // content reliably begins 60px low and only ever rises.
                    gsap.set(content, { y: 60 });
                    gsap.to(content, {
                        y: 0,
                        ease: "none",
                        scrollTrigger: {
                            trigger: sec,
                            start: "top bottom",
                            end: "top 42%",
                            scrub: 0.7,
                            invalidateOnRefresh: true,
                        },
                    });
                });
            }
        }
    );

    // (Cursor-reactive light / tilt / magnetic buttons removed by request —
    // the page now reacts only to hover and scroll.)

    // Webfonts shift layout after first paint; re-measure trigger positions.
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
            ScrollTrigger.refresh();
        });
    }
})();
