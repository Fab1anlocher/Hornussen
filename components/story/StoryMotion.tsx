"use client";

import { useEffect } from "react";
import { formatCH, formatPct } from "@/lib/format";

/**
 * Drives every scroll effect on the story page from one place: reveal-on-enter,
 * counting numbers, the growing okta bars, the top progress bar and the hero
 * parallax. The markup itself stays server-rendered and carries only data
 * attributes, so nothing here is required for the page to be readable.
 */
export function StoryMotion() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // --- counting numbers -------------------------------------------------
    const counted = new WeakSet<Element>();

    const countUp = (el: Element) => {
      if (counted.has(el) || reduced) return;
      counted.add(el);
      const target = Number(el.getAttribute("data-count"));
      if (!Number.isFinite(target)) return;
      const pct = el.getAttribute("data-format") === "pct";
      const start = performance.now();
      const duration = 1400;
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const value = Math.round(target * (1 - Math.pow(1 - p, 3)));
        el.textContent = pct ? formatPct(value) : formatCH(value);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const counters = [...document.querySelectorAll<HTMLElement>("[data-count]")];
    if (!reduced) {
      // Only blank out counters that are still below the fold, so a number the
      // reader is already looking at never flickers back to zero.
      for (const el of counters) {
        if (el.getBoundingClientRect().top > window.innerHeight) {
          el.textContent = el.getAttribute("data-format") === "pct" ? formatPct(0) : "0";
        }
      }
    }

    // --- reveal + bars ----------------------------------------------------
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target;

          if (el.hasAttribute("data-reveal")) {
            el.classList.add("is-in");
            if (el.hasAttribute("data-count")) countUp(el);
            el.querySelectorAll("[data-count]").forEach(countUp);
          }

          if (el.hasAttribute("data-bars")) {
            el.querySelectorAll<HTMLElement>(".okta-bar").forEach((bar, i) => {
              bar.style.transitionDelay = `${i * 70}ms`;
              bar.classList.add("is-in");
            });
            // Sky swatches already carry their delay from the server render.
            el.querySelectorAll(".sky-swatch").forEach((s) => s.classList.add("is-in"));
          }

          // Distribution dots carry their own authored stagger, so they only
          // need the flag flipped.
          if (el.hasAttribute("data-dots")) {
            el.querySelectorAll(".dist-dot, .dist-fit").forEach((n) =>
              n.classList.add("is-in"),
            );
          }

          observer.unobserve(el);
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );

    document
      .querySelectorAll("[data-reveal], [data-bars], [data-dots]")
      .forEach((el) => observer.observe(el));

    // Staggered reveals read as a cascade only if they start together, so give
    // each element its authored delay up front.
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      const delay = Number(el.getAttribute("data-reveal")) || 0;
      if (delay) el.style.transitionDelay = `${delay}ms`;
    });

    // --- progress bar + parallax -----------------------------------------
    const progress = document.querySelector<HTMLElement>("[data-progress]");
    const layers = [...document.querySelectorAll<HTMLElement>("[data-parallax]")];
    // Parallax is disabled on narrow screens: on phones it fights the
    // browser's own scroll compositing and stutters.
    const parallaxOn = !reduced && window.innerWidth > 700;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (progress) {
          const max = document.documentElement.scrollHeight - window.innerHeight;
          progress.style.width = `${Math.min(100, (y / (max || 1)) * 100)}%`;
        }
        if (parallaxOn) {
          for (const layer of layers) {
            const rate = Number(layer.getAttribute("data-parallax")) || 0;
            layer.style.transform = `translate3d(0, ${y * rate}px, 0)`;
          }
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
