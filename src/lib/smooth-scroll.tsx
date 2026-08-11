'use client';

/**
 * Lenis smooth scroll, wired to GSAP ScrollTrigger.
 *
 * The two must share one clock. If Lenis runs on its own rAF and ScrollTrigger
 * on GSAP's ticker, triggers fire against a scroll position that is one frame
 * stale — which reads as pinned sections "slipping" during fast scrolls.
 * So: Lenis is driven BY the GSAP ticker, and ScrollTrigger.update is bound to
 * Lenis's scroll event.
 *
 * The instance lives in a ref, not in state. Putting it in state means every
 * consumer re-renders when it initialises, and every overlay has to carry
 * `lenis` in its dependency array to re-run a lock it already performed.
 * Consumers don't want the instance anyway — they want lockScroll/unlockScroll,
 * so that's what the context hands them.
 *
 * Also exposes the current scroll velocity, which the work grid uses to bend
 * its cards — the effect that makes scrolling feel like it has weight.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';
import { useReducedMotion } from './hooks';

type ScrollState = {
  lenisRef: React.RefObject<Lenis | null>;
  /** Signed, normalised scroll velocity. Roughly -1..1 under normal scrolling. */
  velocityRef: React.RefObject<number>;
  /** 0..1 through the whole document. */
  progressRef: React.RefObject<number>;
  scrollTo: (target: string | number | HTMLElement, opts?: { offset?: number }) => void;
  /**
   * Freeze the page behind an overlay. Reference-counted, so a lightbox opened
   * from inside an already-open mobile menu doesn't unfreeze the page when only
   * one of them closes.
   */
  lockScroll: () => void;
  unlockScroll: () => void;
};

const ScrollContext = createContext<ScrollState | null>(null);

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const velocityRef = useRef(0);
  const progressRef = useRef(0);
  const lockCount = useRef(0);
  const prevOverflow = useRef('');
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      // Native scrolling only. ScrollTrigger stays alive so reveals still fire.
      velocityRef.current = 0;
      ScrollTrigger.refresh();
      return;
    }

    const instance = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      syncTouch: false,
      autoRaf: false, // GSAP's ticker drives it instead — see note above
    });
    lenisRef.current = instance;

    // A lock that was taken before Lenis existed (overlay opened during boot)
    // must be honoured, or the page scrolls behind an open dialog.
    if (lockCount.current > 0) instance.stop();

    const onScroll = (e: Lenis) => {
      velocityRef.current = gsap.utils.clamp(-1, 1, e.velocity / 40);
      progressRef.current = e.progress;
      ScrollTrigger.update();
    };
    instance.on('scroll', onScroll);

    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Layout settles after fonts and images land; refresh so scrubbed sections
    // measure against the final page height rather than the pre-font one.
    const refresh = () => ScrollTrigger.refresh();
    const t = window.setTimeout(refresh, 400);
    document.fonts?.ready.then(refresh).catch(() => {});
    window.addEventListener('load', refresh);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener('load', refresh);
      gsap.ticker.remove(tick);
      instance.off('scroll', onScroll);
      instance.destroy();
      lenisRef.current = null;
    };
  }, [reduced]);

  const lockScroll = useCallback(() => {
    lockCount.current += 1;
    if (lockCount.current > 1) return;
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.stop();
    } else {
      // Reduced motion, or Lenis not up yet — fall back to freezing the document.
      prevOverflow.current = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
    }
  }, []);

  const release = useCallback(() => {
    const lenis = lenisRef.current;
    if (lenis) lenis.start();
    document.documentElement.style.overflow = prevOverflow.current;
    prevOverflow.current = '';
  }, []);

  const unlockScroll = useCallback(() => {
    lockCount.current = Math.max(0, lockCount.current - 1);
    if (lockCount.current > 0) return;
    release();
  }, [release]);

  const scrollTo = useCallback<ScrollState['scrollTo']>(
    (target, opts) => {
      const offset = opts?.offset ?? 0;

      // Asking to scroll somewhere always means the page must be scrollable —
      // it is only ever called from a nav action that closes whatever locked us.
      // Lenis bails out of scrollTo() early when it is stopped, so without this
      // a "close the menu and jump to Journey" click closes the menu and then
      // goes nowhere. Releasing here keeps every caller from having to know.
      if (lockCount.current > 0) {
        lockCount.current = 0;
        release();
      }

      const lenis = lenisRef.current;
      if (lenis) {
        lenis.scrollTo(target, { offset, duration: 1.4 });
        return;
      }

      // No Lenis (reduced motion, or before init) — fall back to native.
      if (typeof target === 'number') {
        window.scrollTo({ top: target + offset, behavior: 'smooth' });
        return;
      }
      const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
      if (!el) return;
      // getBoundingClientRect + scrollY, not offsetTop: offsetTop is measured
      // against the nearest positioned ancestor, and several sections here sit
      // inside `relative` wrappers — offsetTop would land short by the wrapper's
      // own offset.
      const top = el.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top, behavior: 'smooth' });
    },
    [release],
  );

  const value = useMemo<ScrollState>(
    () => ({ lenisRef, velocityRef, progressRef, scrollTo, lockScroll, unlockScroll }),
    [scrollTo, lockScroll, unlockScroll],
  );

  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>;
}

export function useSmoothScroll(): ScrollState {
  const ctx = useContext(ScrollContext);
  if (!ctx) {
    throw new Error('useSmoothScroll must be used inside <SmoothScrollProvider>');
  }
  return ctx;
}
