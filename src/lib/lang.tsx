'use client';

/**
 * Language state.
 *
 * Deliberately client-side rather than route-based (/en, /ru, /uz). On a
 * scroll-choreographed WebGL site a full navigation would tear down the canvas
 * and throw the visitor back to the top of the page every time they switch —
 * which is exactly the moment they are least willing to lose their place.
 * All three copies together are a few KB, so shipping them costs less than a
 * round trip would.
 *
 * `?lang=ru` is honoured on first load so a link can still be shared in a
 * specific language.
 *
 * Modelled as a module-level external store rather than useState + useEffect.
 * The stored preference lives in localStorage — genuinely outside React — and
 * useSyncExternalStore is built for precisely this: it renders the server
 * snapshot during hydration and swaps to the client's real value immediately
 * after, with no mismatch warning and no cascading re-render.
 */

import { useCallback, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { COPY, DEFAULT_LANG, LANGS, type Copy, type Lang } from '@/content/site';

const STORAGE_KEY = 'mookhayo:lang';

function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

function readStoredLang(): Lang {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (isLang(fromUrl)) return fromUrl;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    /* private mode — fall through to default */
  }
  return DEFAULT_LANG;
}

/* --- the store ---------------------------------------------------------- */

let current: Lang = DEFAULT_LANG;
let resolved = false;
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot(): Lang {
  // Resolve lazily on first client read, then cache. Returning a primitive keeps
  // the snapshot referentially stable, which useSyncExternalStore requires.
  if (!resolved) {
    current = readStoredLang();
    resolved = true;
  }
  return current;
}

function getServerSnapshot(): Lang {
  return DEFAULT_LANG;
}

function writeLang(next: Lang) {
  if (next === current) return;
  current = next;
  resolved = true;

  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* non-fatal */
  }

  // Keep the URL shareable without navigating.
  const url = new URL(window.location.href);
  if (next === DEFAULT_LANG) url.searchParams.delete('lang');
  else url.searchParams.set('lang', next);
  window.history.replaceState({}, '', url);

  for (const listener of listeners) listener();
}

/* --- react surface ------------------------------------------------------ */

/**
 * Keeps <html lang> in step with the store. There is no context here — the
 * store is module-scoped — so this exists purely to own that DOM side effect
 * in one place.
 */
export function LangProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return <>{children}</>;
}

export function useLang(): { lang: Lang; copy: Copy; setLang: (next: Lang) => void } {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setLang = useCallback((next: Lang) => writeLang(next), []);

  return useMemo(() => ({ lang, copy: COPY[lang], setLang }), [lang, setLang]);
}

/** Convenience: just the copy object. */
export function useCopy(): Copy {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return COPY[lang];
}
