'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

/**
 * These read the *device*, not React state — so they're external stores, and
 * useSyncExternalStore is the honest way to model that. The useState+useEffect
 * version renders once with a wrong answer, then again with the right one,
 * which on this site means the WebGL layer briefly decides it isn't allowed
 * and tears down a canvas it is about to rebuild.
 */

const NOOP_SUBSCRIBE = () => () => {};

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

/**
 * Hardware capability. Computed once and memoised at module scope: it cannot
 * change for the life of the tab, and useSyncExternalStore requires a snapshot
 * that is cheap and referentially stable or it re-renders forever.
 */
let capabilityCache: boolean | null = null;

function computeCapability(): boolean {
  if (typeof window === 'undefined') return false;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  let hasWebGL = false;
  try {
    const canvas = document.createElement('canvas');
    hasWebGL = Boolean(canvas.getContext('webgl2'));
  } catch {
    hasWebGL = false;
  }
  return hasWebGL && cores >= 4 && mem >= 4;
}

function getCapability(): boolean {
  if (capabilityCache === null) capabilityCache = computeCapability();
  return capabilityCache;
}

/**
 * Whether this device should run the full WebGL layer.
 *
 * Drama has a power budget. A phone that thermally throttles halfway down the
 * page is a worse experience than one that never had the shader at all, so the
 * heavy effects are gated on a real pointer, enough hardware, and motion consent.
 */
export function useWebGLAllowed(): boolean {
  const capable = useSyncExternalStore(NOOP_SUBSCRIBE, getCapability, () => false);
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  return capable && fine && !reduced;
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
