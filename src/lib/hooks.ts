'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

/**
 * These read the *device*, not React state — so they're external stores, and
 * useSyncExternalStore is the honest way to model that. The useState+useEffect
 * version renders once with a wrong answer, then again with the right one,
 * which on this site means the WebGL layer briefly decides it isn't allowed
 * and tears down a canvas it is about to rebuild.
 */

/** SSR-safe media query. Returns `false` during server render and hydration. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** True when the visitor has asked the OS to calm motion down. */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/** True for mouse/trackpad. False for touch — where a custom cursor is nonsense. */
export function useFinePointer(): boolean {
  return useMediaQuery('(hover: hover) and (pointer: fine)');
}

export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/** Tracks whether an element has entered the viewport at least once. */
export function useInViewOnce<T extends Element>(
  ref: React.RefObject<T | null>,
  rootMargin = '0px',
): boolean {
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Fires from an observer callback, not synchronously in the effect
          // body — this is exactly the subscribe-and-setState-later shape.
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, seen]);

  return seen;
}
