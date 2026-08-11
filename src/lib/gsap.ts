'use client';

/**
 * One GSAP registration point for the whole app.
 *
 * Importing gsap in several modules and calling registerPlugin in each one is
 * how you end up with two ScrollTrigger instances disagreeing about scroll
 * position. Everything comes through here instead.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let registered = false;

if (typeof window !== 'undefined' && !registered) {
  gsap.registerPlugin(ScrollTrigger);
  // Lenis owns the scroll position; ScrollTrigger must not try to smooth it too.
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.defaults({ ease: 'expo.out', duration: 1.1 });
  registered = true;
}

export { gsap, ScrollTrigger };

/** Shared easing names, so section authors don't each invent their own feel. */
export const EASE = {
  out: 'expo.out',
  inOut: 'power4.inOut',
  soft: 'power2.out',
} as const;

/**
 * Standard entrance for a block of content.
 * Returns a cleanup function. Safe to call when reduced-motion is on — it just
 * sets the final state immediately.
 */
export function revealOnScroll(
  targets: gsap.TweenTarget,
  opts: { y?: number; stagger?: number; start?: string; reduced?: boolean; delay?: number } = {},
): () => void {
  const { y = 28, stagger = 0.07, start = 'top 82%', reduced = false, delay = 0 } = opts;

  if (reduced) {
    gsap.set(targets, { opacity: 1, y: 0 });
    return () => {};
  }

  const tween = gsap.fromTo(
    targets,
    { opacity: 0, y },
    {
      opacity: 1,
      y: 0,
      duration: 1.05,
      delay,
      stagger,
      ease: EASE.out,
      scrollTrigger: { trigger: targets as gsap.DOMTarget, start, once: true },
    },
  );

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
}
