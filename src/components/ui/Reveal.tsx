'use client';

/**
 * Scroll-entrance primitives.
 *
 * Hard rule enforced here: content starts VISIBLE in the DOM and is hidden by
 * JS only once we know the animation will run. A reveal system that starts at
 * opacity:0 in CSS turns a JS error into a blank page — which is the worst
 * possible failure mode for a portfolio.
 */

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';
import { gsap, ScrollTrigger, EASE } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/hooks';

type RevealProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** Distance travelled, px */
  y?: number;
  delay?: number;
  /** ScrollTrigger start string */
  start?: string;
};

export function Reveal({
  children,
  className = '',
  as: Tag = 'div',
  y = 30,
  delay = 0,
  start = 'top 84%',
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 1.1,
          delay,
          ease: EASE.out,
          scrollTrigger: { trigger: el, start, once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [reduced, y, delay, start]);

  return (
    <Tag ref={ref} className={className} data-reveal>
      {children}
    </Tag>
  );
}

/**
 * Staggered reveal of a container's direct children.
 * Use for lists, grids and anything where items should arrive in sequence.
 */
export function RevealGroup({
  children,
  className = '',
  as: Tag = 'div',
  y = 26,
  stagger = 0.08,
  start = 'top 84%',
  selector = ':scope > *',
}: RevealProps & { stagger?: number; selector?: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const items = Array.from(el.querySelectorAll(selector));
    if (!items.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger,
          ease: EASE.out,
          scrollTrigger: { trigger: el, start, once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [reduced, y, stagger, start, selector]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

/**
 * Headline reveal: each line rises out of its own mask.
 * Splits on the caller-supplied array rather than measuring text, because
 * measuring re-flows differently once the webfont swaps in and the lines jump.
 */
export function MaskLines({
  lines,
  className = '',
  as: Tag = 'h2',
  delay = 0,
  start = 'top 86%',
}: {
  lines: string[];
  className?: string;
  as?: ElementType;
  delay?: number;
  start?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const inner = el.querySelectorAll('.line-mask > span');
    if (!inner.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        inner,
        { yPercent: 108 },
        {
          yPercent: 0,
          duration: 1.25,
          delay,
          stagger: 0.085,
          ease: EASE.out,
          scrollTrigger: { trigger: el, start, once: true },
        },
      );
    }, el);

    return () => {
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, [reduced, delay, start]);

  return (
    <Tag ref={ref} className={className}>
      {lines.map((line, i) => (
        <span className="line-mask" key={`${line}-${i}`}>
          <span>{line}</span>
        </span>
      ))}
    </Tag>
  );
}
