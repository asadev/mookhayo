'use client';

/**
 * The shot list, pinned to the right edge.
 *
 * Numbers only at rest — the same two-digit index the sections print, so the
 * rail and the page can never disagree about which shot you're on. The label
 * is a hover/focus tooltip because six words stacked down the edge of a
 * cinematic page is a menu, not chrome.
 *
 * Desktop only, and gated on the media query rather than a CSS `hidden` class:
 * no reason to run an IntersectionObserver over eight sections on a phone that
 * will never see the result.
 */

import { useCallback, useEffect, useState } from 'react';
import { SITE, type SectionId } from '@/content/site';
import { sectionIndex } from '@/components/ui/Section';
import { useMediaQuery } from '@/lib/hooks';
import { useCopy } from '@/lib/lang';
import { useSmoothScroll } from '@/lib/smooth-scroll';

type NavSectionId = Exclude<SectionId, 'hero' | 'intro'>;

const NAV_SECTIONS = SITE.navSections.filter(
  (id): id is NavSectionId => id !== 'hero' && id !== 'intro',
);

/** A 10%-tall band across the middle of the viewport is what "here" means. */
const BAND = '-45% 0px -45% 0px';
/** Matches the header's own gap so both entry points land identically. */
const SCROLL_GAP = 8;

export function NavRail() {
  const copy = useCopy();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { scrollTo } = useSmoothScroll();
  const [active, setActive] = useState<NavSectionId | null>(null);

  useEffect(() => {
    if (!isDesktop) return;

    const els = NAV_SECTIONS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (!els.length) return;

    const inBand = new Set<string>();
    let current: NavSectionId | null = null;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inBand.add(entry.target.id);
          else inBand.delete(entry.target.id);
        }

        // Resolve ties in page order rather than in callback order: with two
        // sections touching the band the marker would otherwise flip back and
        // forth depending on which entry the observer reported first.
        let next = NAV_SECTIONS.find((id) => inBand.has(id)) ?? null;

        if (!next) {
          // Empty band means we're either above the first nav section
          // (hero/intro — nothing should be marked) or past the last one
          // (footer — blanking the rail there would read as a bug).
          const first = document.getElementById(NAV_SECTIONS[0]);
          next =
            first && first.getBoundingClientRect().top > window.innerHeight / 2 ? null : current;
        }

        if (next !== current) {
          current = next;
          setActive(next);
        }
      },
      { rootMargin: BAND, threshold: 0 },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [isDesktop]);

  const go = useCallback(
    (id: NavSectionId) => {
      const header = document.querySelector<HTMLElement>('header');
      scrollTo(`#${id}`, { offset: -((header?.offsetHeight ?? 72) + SCROLL_GAP) });
    },
    [scrollTo],
  );

  if (!isDesktop) return null;

  return (
    <nav
      aria-label={copy.nav.index}
      className="fixed right-[clamp(0.75rem,2vw,2rem)] top-1/2 z-40 -translate-y-1/2"
    >
      {/* The dots read as one strip of film rather than six loose marks. */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-[6.5px] top-2 bottom-2 w-px bg-linear-to-b from-transparent via-cream/12 to-transparent"
      />

      <ul className="relative flex flex-col items-end">
        {NAV_SECTIONS.map((id) => {
          const isActive = active === id;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => go(id)}
                aria-current={isActive ? 'true' : undefined}
                data-cursor="link"
                className="group relative flex h-11 items-center justify-end gap-2.5 pl-3 pr-1"
              >
                <span className="glass pointer-events-none absolute right-full mr-3 translate-x-1 whitespace-nowrap rounded-full px-3 py-1.5 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-cream opacity-0 transition duration-300 ease-out-expo group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
                  {copy.nav[id]}
                </span>

                <span
                  className={`font-mono text-[0.625rem] tracking-[0.18em] transition-colors duration-300 ease-out-expo ${
                    isActive ? 'text-cream' : 'text-smoke group-hover:text-bone'
                  }`}
                >
                  {sectionIndex(id)}
                </span>

                <span
                  className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ease-out-expo ${
                    isActive
                      ? 'scale-100 bg-ember-hot shadow-[0_0_10px_rgba(233,133,63,0.85)]'
                      : 'scale-75 bg-cream/20 group-hover:bg-bone/60'
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
