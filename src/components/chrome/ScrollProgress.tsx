'use client';

/**
 * One ember hairline across the top edge — how far through the film we are.
 *
 * Driven straight off Lenis's own progress value in a rAF loop that writes
 * scaleX to the node. Progress changes every frame while scrolling, so putting
 * it in React state would re-render the chrome (and everything under it) at
 * 120Hz to move one line by a pixel.
 */

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/lib/hooks';
import { useSmoothScroll } from '@/lib/smooth-scroll';

/** Below this, the change is sub-pixel: not worth a composite. */
const EPSILON = 0.0008;

export function ScrollProgress() {
  const reduced = useReducedMotion();
  const { progressRef } = useSmoothScroll();
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el || reduced) return;

    let frame = 0;
    let painted = -1;

    const tick = () => {
      let p = progressRef.current;

      // Lenis only publishes progress after its first scroll event, so a reload
      // that restores the visitor mid-page would show an empty line until they
      // move. scrollY is free to read; the layout read only happens in that gap.
      if (p === 0 && window.scrollY > 0) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        p = max > 0 ? window.scrollY / max : 0;
      }

      p = p < 0 ? 0 : p > 1 ? 1 : p;

      if (Math.abs(p - painted) > EPSILON) {
        painted = p;
        el.style.transform = `scaleX(${p})`;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced, progressRef]);

  // Under reduced motion this is pure decoration tied to movement — drop it
  // rather than animate it slower.
  if (reduced) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-px">
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-linear-to-r from-ember via-flare to-glow"
        style={{ transform: 'scaleX(0)', willChange: 'transform' }}
      />
    </div>
  );
}
