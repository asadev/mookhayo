'use client';

/**
 * Top chrome.
 *
 * Invisible at rest so the hero owns the first screen, then settles into glass
 * once the page has actually moved. It also steps out of the way on the way
 * down and returns on the way up — with a dead-zone on the scroll delta,
 * because reacting to every momentum wobble is exactly how this pattern turns
 * into a strobe.
 *
 * The glass is a separate layer whose opacity fades rather than a class that
 * gets swapped: toggling backdrop-filter on and off snaps, and a bar that
 * snaps reads as a bug.
 */

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { SITE, type SectionId } from '@/content/site';
import { Shell, sectionIndex } from '@/components/ui/Section';
import { useReducedMotion } from '@/lib/hooks';
import { useCopy } from '@/lib/lang';
import { useSmoothScroll } from '@/lib/smooth-scroll';
import { LangSwitcher } from './LangSwitcher';
import { LogoMark } from './LogoMark';

type NavSectionId = Exclude<SectionId, 'hero' | 'intro'>;

/**
 * Narrowed once at module scope. copy.nav has no key for hero/intro on purpose,
 * so the nav list and the copy object can never drift out of sync.
 */
const NAV_SECTIONS = SITE.navSections.filter(
  (id): id is NavSectionId => id !== 'hero' && id !== 'intro',
);

/** Past this the bar stops being transparent. */
const SETTLE_AT = 80;
/** Direction changes smaller than this are jitter, not intent. */
const DIRECTION_DEADZONE = 8;
/** Never hide while the wordmark is still the visitor's only orientation cue. */
const HIDE_AFTER = 160;
/** Breathing room between the bar and whatever it scrolled to. */
const SCROLL_GAP = 8;

/**
 * Sections aren't focusable, so borrow focus for one interaction and hand it
 * back. Without this, a keyboard visitor who uses the skip link or the menu is
 * scrolled to a new section while their focus is still up in the header.
 */
function focusSection(id: SectionId) {
  const el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
  el.addEventListener('blur', () => el.removeAttribute('tabindex'), { once: true });
}

export function Header() {
  const copy = useCopy();
  const reduced = useReducedMotion();
  const { lockScroll, unlockScroll, scrollTo } = useSmoothScroll();

  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef(false);

  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  /* --- scroll state ------------------------------------------------------ */

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > SETTLE_AT);

      const delta = y - lastY;
      // lastY only moves once the visitor has committed to a direction — that
      // deferred anchor is what makes the hysteresis work.
      if (Math.abs(delta) < DIRECTION_DEADZONE) return;
      lastY = y;

      if (reduced || openRef.current) {
        setHidden(false);
        return;
      }
      setHidden(delta > 0 && y > HIDE_AFTER);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    // A reload can restore the visitor mid-page, so take one measurement on
    // mount — through the same rAF path, so state never lands synchronously.
    frame = requestAnimationFrame(measure);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  /* --- the sheet cannot outlive its own breakpoint ----------------------- */

  // The sheet and its toggle are both `lg:hidden`. Crossing that breakpoint
  // with the menu open (tablet rotating to landscape) would hide every control
  // that can close it while the scroll lock stayed on — leaving a page that
  // cannot be scrolled and a rail whose buttons silently no-op, because Lenis
  // drops scrollTo() while stopped. Close it with the breakpoint; the effect
  // below releases the lock on cleanup.
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (mql.matches) setOpen(false);
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  /* --- open menu: hold the page still, and listen for Escape ------------- */

  useEffect(() => {
    if (!open) return;

    lockScroll();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      unlockScroll();
    };
  }, [open, lockScroll, unlockScroll]);

  /* --- navigation -------------------------------------------------------- */

  /**
   * Just closes the sheet. Releasing the scroll lock in time for a navigation
   * used to have to happen here too — cleanup runs after the commit, and
   * `lenis.scrollTo()` bails out early while the instance is stopped, so
   * closing and navigating in one click closed the menu and then went nowhere.
   * `scrollTo` now lifts any outstanding lock itself, so callers don't have to
   * know, and the effect cleanup stays the single owner of the unlock.
   */
  const closeMenu = useCallback(() => setOpen(false), []);

  const goTo = useCallback(
    (id: SectionId) => {
      // Measured, not assumed: the bar is a different height per breakpoint and
      // a hardcoded offset buries the section heading underneath it.
      const gap = (headerRef.current?.offsetHeight ?? 72) + SCROLL_GAP;
      scrollTo(`#${id}`, { offset: -gap });
      focusSection(id);
    },
    [scrollTo],
  );

  const onSkip = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      // Lenis owns the scroll position; letting the browser jump the hash would
      // desync it from the smooth-scroll instance.
      e.preventDefault();
      goTo('intro');
    },
    [goTo],
  );

  return (
    <>
      {/* Off-viewport rather than clipped to 1px, so it can slide in when a
          keyboard visitor reaches it on the first Tab. */}
      <a
        href="#intro"
        onClick={onSkip}
        data-cursor="link"
        className="glass fixed left-[var(--shell-x)] top-3 z-[70] -translate-y-[300%] rounded-full px-5 py-3 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-cream transition-transform duration-300 ease-out-expo focus-visible:translate-y-0"
      >
        {copy.a11y.skipToContent}
      </a>

      <header
        ref={headerRef}
        className={`fixed inset-x-0 top-0 z-50 transition-transform duration-500 ease-out-expo focus-within:translate-y-0 ${
          hidden ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        {/* The sheet already supplies glass behind the bar — stacking a second
            pane on top of it just darkens the strip. */}
        <div
          aria-hidden
          className={`glass-chrome absolute inset-0 transition-opacity duration-500 ease-out-expo ${
            scrolled && !open ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          aria-hidden
          className={`hairline absolute inset-x-0 bottom-0 transition-opacity duration-500 ${
            scrolled && !open ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <Shell className="relative flex h-[4.5rem] items-center justify-between gap-4 lg:h-[5.25rem]">
          <button
            type="button"
            onClick={() => scrollTo(0)}
            aria-label={copy.footer.backToTop}
            data-cursor="link"
            className="group flex items-center gap-2.5 text-cream transition-colors duration-300 ease-out-expo hover:text-glow sm:gap-3"
          >
            {/* The aperture opens a few degrees on hover — the one place the
                mark moves, and it moves the way the object it depicts does. */}
            <LogoMark className="h-[1.15rem] w-[1.15rem] shrink-0 text-flare transition-[transform,color] duration-500 ease-out-expo group-hover:rotate-[22deg] group-hover:text-glow sm:h-[1.3rem] sm:w-[1.3rem]" />
            <span className="font-mono text-[0.7rem] tracking-[0.42em]">{SITE.mark}</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <LangSwitcher />

            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? copy.a11y.close : copy.a11y.menu}
              data-cursor="link"
              className="flex h-11 w-11 items-center justify-center lg:hidden"
            >
              <span aria-hidden className="relative block h-3.5 w-5">
                <span
                  className={`absolute left-0 block h-px w-full bg-cream transition-all duration-300 ease-out-expo ${
                    open ? 'top-1/2 rotate-45' : 'top-0'
                  }`}
                />
                <span
                  className={`absolute left-0 block h-px w-full bg-cream transition-all duration-300 ease-out-expo ${
                    open ? 'top-1/2 -rotate-45' : 'top-full'
                  }`}
                />
              </span>
            </button>
          </div>
        </Shell>
      </header>

      {open ? (
        <nav
          id="mobile-nav"
          aria-label={copy.a11y.menu}
          className="glass fixed inset-0 z-40 flex flex-col overflow-y-auto pt-[5.5rem] opacity-100 transition-opacity duration-500 ease-out-expo starting:opacity-0 lg:hidden"
        >
          {/* Bottom-anchored: on a phone the thumb lives down here, not up by
              the menu button that opened it. */}
          <Shell className="mt-auto pb-[max(2.5rem,env(safe-area-inset-bottom))]">
            <ul className="flex flex-col">
              {NAV_SECTIONS.map((id, i) => (
                <li
                  key={id}
                  style={{ transitionDelay: reduced ? undefined : `${60 + i * 45}ms` }}
                  // `translate`, not `transform`: Tailwind v4's translate
                  // utilities write the standalone property, and transitioning
                  // `transform` here would silently animate nothing.
                  className="border-t border-cream/8 transition-[opacity,translate] duration-700 ease-out-expo first:border-t-0 starting:translate-y-4 starting:opacity-0"
                >
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      goTo(id);
                    }}
                    data-cursor="link"
                    className="group flex w-full items-baseline gap-4 py-4 text-left"
                  >
                    <span className="t-meta text-ember-hot">{sectionIndex(id)}</span>
                    <span className="t-heading truncate-1 text-[clamp(1.9rem,9vw,2.75rem)] text-cream transition-colors duration-300 ease-out-expo group-hover:text-glow">
                      {copy.nav[id]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Shell>
        </nav>
      ) : null}
    </>
  );
}
