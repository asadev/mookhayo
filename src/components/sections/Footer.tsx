'use client';

/**
 * End credits. Deliberately the quietest block on the page — the contact section
 * is the close, and anything loud down here would compete with it.
 *
 * Back-to-top goes through Lenis rather than an #anchor so the return journey is
 * the same weighted scroll as everything else; when Lenis is absent (reduced
 * motion) scrollTo falls back to the native path on its own.
 */

import { useSyncExternalStore } from 'react';
import { SITE } from '@/content/site';
import { Shell } from '@/components/ui/Section';
import { useCopy } from '@/lib/lang';
import { useSmoothScroll } from '@/lib/smooth-scroll';
import { LogoMark } from '@/components/chrome/LogoMark';

/**
 * The clock is an external system, and it is the visitor's clock — not the
 * build machine's. Reading it during render would bake the server's year into
 * the HTML, and one New Year's Eve across timezones makes that a hydration
 * mismatch. useSyncExternalStore hydrates against the server snapshot (nothing)
 * and swaps to the client snapshot immediately after, which is exactly the
 * contract we want. Nothing to subscribe to: the year cannot change mid-session.
 */
const subscribeToClock = () => () => {};
const getYear = () => new Date().getFullYear();
const getServerYear = () => null;

export function Footer() {
  const copy = useCopy();
  const { scrollTo } = useSmoothScroll();

  const year = useSyncExternalStore<number | null>(subscribeToClock, getYear, getServerYear);

  return (
    <footer className="relative">
      <div className="hairline" aria-hidden />

      <Shell className="flex flex-col gap-[clamp(1.75rem,4vh,2.75rem)] py-[clamp(3rem,7vh,4.5rem)]">
        <div className="flex flex-col gap-[clamp(1.5rem,3vh,2rem)] sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div className="flex min-w-0 flex-col gap-2.5">
            <span className="flex items-center gap-3">
              <LogoMark className="h-[clamp(1.3rem,3.4vw,1.9rem)] w-[clamp(1.3rem,3.4vw,1.9rem)] shrink-0 text-ember-hot" />
              <span className="t-heading text-[clamp(1.6rem,4.2vw,2.4rem)] tracking-[0.08em] text-cream">
                {SITE.mark}
              </span>
            </span>
            {/* Not truncated: it is four fixed role words, and clipping it to
                "Content…" loses half of what she does. Wrapping is the correct
                behaviour here — there is no user input that could run long. */}
            <span className="t-meta max-w-[54ch] leading-[1.9]">{copy.footer.built}</span>
          </div>

          <button
            type="button"
            onClick={() => scrollTo(0)}
            data-cursor="link"
            className="group glass-chrome inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-3 self-start rounded-full px-5 py-3 sm:self-auto"
          >
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-bone transition-colors duration-300 group-hover:text-cream">
              {copy.footer.backToTop}
            </span>
            <svg
              viewBox="0 0 24 24"
              width="13"
              height="13"
              aria-hidden
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-flame transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1"
            >
              <path d="M12 20V4M5 11l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="hairline" aria-hidden />

        <p className="t-meta flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          {/* No reserved width: the slate voice tracks at 0.22em, so a 4ch box
              overflows and eats the flex gap between the year and the mark. */}
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden>©</span>
            <span className="tabular-nums">{year ?? ''}</span>
          </span>
          <span>{SITE.mark}</span>
          <span aria-hidden>·</span>
          <span>{copy.footer.rights}</span>
        </p>
      </Shell>
    </footer>
  );
}
