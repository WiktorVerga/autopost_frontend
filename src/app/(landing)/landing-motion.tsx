"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Strong ease-out, cubic-bezier(0.23, 1, 0.32, 1): things arrive fast and settle. */
const EASE_OUT = "power4.out";

/**
 * All the landing page motion lives here, so the page itself stays a Server
 * Component: it only marks elements with `data-*` attributes and this wrapper
 * animates whatever it finds.
 *
 * Every animation here has a job: the hero loop explains the product, the
 * guide line shows how far along you are, and the reveals keep content from
 * popping in. Nothing bounces, tilts or loops for its own sake.
 *
 * The page is complete without it. Only the hero starts hidden (class
 * `invisible`, undone by a <noscript> rule in the page); everything else is
 * hidden by GSAP itself, so nothing depends on this script having run.
 */
export function LandingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          // Reduced motion keeps the fades (they help follow the page) and drops all movement.
          const move = Boolean(context.conditions?.motion);
          heroIntro(move);
          scrollReveals(move);
          guideProgress(move);
          if (move) ideaToPostLoop();
        },
      );

      // Web fonts change the layout once they load: re-measure the triggers.
      void document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    { scope: root },
  );

  return (
    <div ref={root} className="landing">
      {children}
    </div>
  );
}

/** Headline lines rise out of their masks, then the rest of the hero fades up. */
function heroIntro(move: boolean) {
  gsap
    .timeline({ defaults: { ease: EASE_OUT } })
    .fromTo(
      "[data-hero-line]",
      move ? { yPercent: 100, autoAlpha: 1 } : { autoAlpha: 0 },
      move ? { yPercent: 0, duration: 0.8, stagger: 0.08 } : { autoAlpha: 1, duration: 0.3 },
    )
    .fromTo(
      "[data-hero-fade]",
      { autoAlpha: 0, y: move ? 10 : 0 },
      { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06 },
      move ? "-=0.5" : "<",
    );
}

/** The hero illustration: each idea in the queue lights up and becomes a post. */
function ideaToPostLoop() {
  const ideas = gsap.utils.toArray<HTMLElement>("[data-idea]");
  const cards = gsap.utils.toArray<HTMLElement>("[data-card]");
  if (ideas.length === 0 || cards.length === 0) return;

  gsap.set(cards, { autoAlpha: 0 });
  const loop = gsap.timeline({ repeat: -1, delay: 1 });

  cards.forEach((card, i) => {
    const stamp = card.querySelector("[data-stamp]");
    loop
      .to(ideas, { opacity: (j: number) => (j === i ? 1 : 0.35), duration: 0.3, ease: "power1.out" })
      // A progress bar is constant motion: linear.
      .fromTo("[data-progress]", { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "none" }, "<")
      .fromTo(
        card,
        { autoAlpha: 0, yPercent: 6, scale: 0.97 },
        { autoAlpha: 1, yPercent: 0, scale: 1, duration: 0.45, ease: EASE_OUT },
      )
      .fromTo(
        stamp,
        { autoAlpha: 0, scale: 0.9 },
        { autoAlpha: 1, scale: 1, duration: 0.2, ease: EASE_OUT },
        "+=0.6",
      )
      // Leaving is quicker than arriving.
      .to(card, { autoAlpha: 0, yPercent: -4, duration: 0.25, ease: "power2.out" }, "+=1.4")
      .set("[data-progress]", { scaleX: 0 });
  });
}

/** Content settles in as it enters the screen: a short fade and a few pixels of travel. */
function scrollReveals(move: boolean) {
  const from = { autoAlpha: 0, y: move ? 12 : 0, duration: 0.5, ease: EASE_OUT };

  gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
    gsap.from(el, { ...from, scrollTrigger: { trigger: el, start: "top 88%", once: true } });
  });

  gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((group) => {
    gsap.from(group.querySelectorAll("[data-reveal-item]"), {
      ...from,
      stagger: 0.06,
      scrollTrigger: { trigger: group, start: "top 85%", once: true },
    });
  });
}

/** The guide: a line that fills as you scroll, and step numbers that light up when reached. */
function guideProgress(move: boolean) {
  const list = document.querySelector<HTMLElement>("[data-steps]");
  if (!list) return;

  if (move) {
    gsap.fromTo(
      "[data-steps-progress]",
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: "none",
        scrollTrigger: { trigger: list, start: "top 60%", end: "bottom 60%", scrub: true },
      },
    );
  }

  gsap.utils.toArray<HTMLElement>("[data-step]").forEach((step) => {
    ScrollTrigger.create({ trigger: step, start: "top 60%", end: "max", toggleClass: "is-active" });
  });
}
