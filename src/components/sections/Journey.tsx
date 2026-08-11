'use client';

/**
 * JOURNEY — the section that proves she is real.
 *
 * Everything else on this page is assertion; this is the receipt. So it is
 * built as a timeline rather than a list: a spine that draws itself as you
 * scroll, with each chapter lighting up as it passes the centre of the frame
 * and falling back to dim as it leaves. That is a rack focus, and it is the
 * whole point — you can only read one chapter at a time, which is exactly how
 * a career is actually lived.
 *
 * Two visual weights, one family:
 *   role      — filled ember marker, display org, full-strength copy
 *   education — hollow marker, smaller org, recessed copy
 * The newest entry (Dubai) is the headline and carries a third, hotter weight.
 * Every difference is a data-driven difference; nothing is decorated by hand.
 */

import { useEffect, useRef } from 'react';
import { JOURNEY, type JourneyEntry } from '@/content/site';
import { gsap } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/hooks';
import { useCopy } from '@/lib/lang';
import { Section, Shell } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';

/** Newest first: the strongest, most commercially relevant card leads. */
const ENTRIES: JourneyEntry[] = [...JOURNEY].sort((a, b) => b.sort - a.sort);
const HEADLINE_ID = ENTRIES[0]?.id ?? '';

/** How far an out-of-focus chapter falls back. Dim enough to defocus, never unreadable. */
const DIM = 0.4;

/**
 * Break a heading into balanced lines at word boundaries.
 *
 * Line breaks in a display heading are an editorial decision, but this heading
 * exists in three languages of very different lengths — a hand-picked split
 * would be right in one and wrong in two. Balancing on measured length is the
 * closest thing to an editorial break that survives translation.
 */
function balanceLines(text: string, maxPerLine = 27): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return [text];

  const count = Math.min(3, Math.max(2, Math.ceil(text.length / maxPerLine)));
  const target = text.length / count;

  const lines: string[] = [];
  let current: string[] = [];
  let length = 0;

  words.forEach((word, i) => {
    const linesLeft = count - lines.length;
    const wordsLeft = words.length - i;
    const grown = length + 1 + word.length;
    // Keep the word if it lands the line CLOSER to target than stopping short
    // does. Breaking the moment the target is exceeded strands short first
    // lines — which is how "Fargʻonadagi" ends up alone above a full line.
    const worseWithWord = Math.abs(grown - target) > Math.abs(length - target);
    // …and only break while enough words remain to fill the lines we still owe.
    if (length > 0 && worseWithWord && linesLeft > 1 && wordsLeft >= linesLeft) {
      lines.push(current.join(' '));
      current = [];
      length = 0;
    }
    current.push(word);
    length += (length ? 1 : 0) + word.length;
  });

  if (current.length) lines.push(current.join(' '));
  return lines;
}

export function Journey() {
  const copy = useCopy();
  const reduced = useReducedMotion();

  const rootRef = useRef<HTMLElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const headRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const spine = spineRef.current;
    if (!root || !spine || reduced) return;

    const ctx = gsap.context(() => {
      // --- the spine draws itself -------------------------------------------
      // scaleY rather than height so the browser never re-lays-out the column
      // the entries live in. The travelling head is a separate element because
      // anything inside the fill would be squashed by the same scale.
      const fill = fillRef.current;
      const head = headRef.current;

      if (fill) {
        const draw = gsap.timeline({
          scrollTrigger: {
            trigger: spine,
            start: 'top 78%',
            end: 'bottom 58%',
            scrub: 0.55,
            invalidateOnRefresh: true,
          },
        });

        draw.fromTo(fill, { scaleY: 0 }, { scaleY: 1, ease: 'none', duration: 1 }, 0);

        if (head) {
          // Function value + invalidateOnRefresh so a resize (or a language
          // switch that changes the column height) re-measures the travel.
          draw
            .fromTo(head, { opacity: 0 }, { opacity: 1, ease: 'none', duration: 0.06 }, 0)
            .fromTo(head, { y: 0 }, { y: () => spine.offsetHeight, ease: 'none', duration: 1 }, 0);
        }
      }

      // --- each chapter racks into focus, then back out ----------------------
      gsap.utils.toArray<HTMLElement>('[data-journey-entry]', root).forEach((item) => {
        const halo = item.querySelector<HTMLElement>('[data-journey-halo]');
        const connector = item.querySelector<HTMLElement>('[data-journey-connector]');

        // Total duration 2: rise over the first beat, hold across the gap at
        // the viewport middle, fall over the last. Scrubbed, so the visitor's
        // scroll speed is the shutter.
        const focus = gsap.timeline({
          scrollTrigger: { trigger: item, start: 'top 90%', end: 'bottom 18%', scrub: 0.4 },
        });

        focus
          .fromTo(item, { opacity: DIM }, { opacity: 1, ease: 'none', duration: 1 }, 0)
          .to(item, { opacity: DIM, ease: 'none', duration: 0.85 }, 1.15);

        if (halo) {
          focus
            .fromTo(halo, { opacity: 0.05, scale: 0.35 }, { opacity: 1, scale: 1, ease: 'none', duration: 1 }, 0)
            .to(halo, { opacity: 0.05, scale: 0.35, ease: 'none', duration: 0.85 }, 1.15);
        }

        if (connector) {
          focus
            .fromTo(connector, { opacity: 0.1 }, { opacity: 1, ease: 'none', duration: 1 }, 0)
            .to(connector, { opacity: 0.1, ease: 'none', duration: 0.85 }, 1.15);
        }
      });
    }, root);

    return () => ctx.revert();
    // `copy` identity changes only when the language does — and a language
    // change re-flows every measurement these triggers depend on.
  }, [reduced, copy]);

  return (
    <Section id="journey" ref={rootRef}>
      <Shell>
        <SectionHeader
          id="journey"
          eyebrow={copy.journey.eyebrow}
          headingLines={balanceLines(copy.journey.heading)}
          body={copy.journey.body}
        />

        <div className="relative mt-[clamp(3.5rem,8vh,6rem)]">
          {/* --- spine ------------------------------------------------------ */}
          <div
            ref={spineRef}
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-[5px] w-px lg:left-1/2 lg:-translate-x-1/2"
          >
            {/* dim track: the whole route, always present */}
            <span className="absolute inset-0 bg-linear-to-b from-transparent via-cream/12 to-transparent" />
            {/* the drawn line. Full height by default so a JS failure or
                reduced motion leaves a complete, correct spine. */}
            <span
              ref={fillRef}
              className="absolute inset-0 origin-top bg-linear-to-b from-ember/60 via-ember-hot to-flare"
            />
            {/* leading edge — only exists while it can actually travel.
                Starts invisible: a stalled head parked at the top of an
                already-complete spine would be a lie about scroll position. */}
            {reduced ? null : (
              <span ref={headRef} className="absolute inset-x-0 top-0 block" style={{ opacity: 0 }}>
                <span
                  className="absolute left-1/2 top-1/2 block h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full lg:h-24 lg:w-24"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(255,158,94,0.5) 0%, rgba(233,133,63,0.16) 34%, rgba(135,55,3,0.05) 60%, transparent 74%)',
                    mixBlendMode: 'screen',
                  }}
                />
                <span className="absolute left-1/2 top-1/2 block h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-glow" />
              </span>
            )}
          </div>

          {/* --- chapters ---------------------------------------------------- */}
          <ol className="relative list-none">
            {ENTRIES.map((entry, i) => {
              const item = copy.journey.entries[entry.id];
              // A structural entry with no copy would render an empty card —
              // better to skip it than to publish a blank chapter.
              if (!item) return null;

              const isRole = entry.kind === 'role';
              const isHeadline = entry.id === HEADLINE_ID;
              // Alternate around the spine on desktop; index 0 sits right, so
              // the headline reads first in the natural left-to-right sweep.
              const onLeft = i % 2 === 1;
              const index = String(i + 1).padStart(2, '0');

              return (
                <li
                  key={entry.id}
                  data-journey-entry
                  className="relative pb-[clamp(3.25rem,7vh,5.5rem)] last:pb-0 lg:grid lg:grid-cols-2"
                >
                  {/* marker: a zero-size anchor sitting exactly on the spine */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-[5px] top-[0.5rem] z-10 lg:left-1/2"
                  >
                    <span className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2">
                      <span
                        data-journey-halo
                        className={`block rounded-full ${
                          isHeadline ? 'h-16 w-16 lg:h-24 lg:w-24' : 'h-10 w-10 lg:h-16 lg:w-16'
                        }`}
                        style={{
                          background: isRole
                            ? 'radial-gradient(circle, rgba(255,158,94,0.34) 0%, rgba(202,116,59,0.12) 38%, transparent 72%)'
                            : 'radial-gradient(circle, rgba(202,116,59,0.18) 0%, rgba(135,55,3,0.07) 42%, transparent 74%)',
                          mixBlendMode: 'screen',
                          opacity: 0.55,
                        }}
                      />
                    </span>

                    {/* hairline from the spine to the copy */}
                    <span
                      data-journey-connector
                      className={`absolute top-1/2 block h-px w-[clamp(1.1rem,2.4vw,2.5rem)] -translate-y-1/2 bg-linear-to-r from-flame/60 to-transparent ${
                        onLeft
                          ? 'left-0 lg:left-auto lg:right-0 lg:bg-linear-to-l'
                          : 'left-0'
                      }`}
                    />

                    <span
                      className={`absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full ${
                        isHeadline
                          ? 'h-[13px] w-[13px] bg-flare ring-1 ring-glow/60'
                          : isRole
                            ? 'h-[9px] w-[9px] bg-ember-hot ring-1 ring-flare/45'
                            : 'h-[9px] w-[9px] border border-flame/55 bg-void'
                      }`}
                    />
                  </span>

                  <article
                    className={`relative isolate flex flex-col items-start pl-[1.75rem] sm:pl-[2.25rem] lg:pl-0 ${
                      onLeft
                        ? 'lg:col-start-1 lg:row-start-1 lg:items-end lg:pr-[clamp(2rem,4vw,4rem)] lg:text-right'
                        : 'lg:col-start-2 lg:row-start-1 lg:pl-[clamp(2rem,4vw,4rem)]'
                    }`}
                  >
                    {/* the headline chapter gets its own key light */}
                    {isHeadline ? (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -inset-x-4 -inset-y-6 -z-10 rounded-[2rem]"
                        style={{
                          background:
                            'radial-gradient(65% 70% at 50% 38%, rgba(168,72,10,0.15) 0%, rgba(135,55,3,0.05) 45%, transparent 72%)',
                        }}
                      />
                    ) : null}

                    <div
                      className={`t-meta flex flex-wrap items-center gap-x-3 gap-y-1 ${
                        onLeft ? 'lg:flex-row-reverse' : ''
                      }`}
                    >
                      <span className={isRole ? 'text-ember-hot' : 'text-smoke'}>{index}</span>
                      <span
                        aria-hidden
                        className={`inline-block h-px w-6 ${
                          onLeft
                            ? 'bg-linear-to-r from-ember-hot/60 to-transparent lg:bg-linear-to-l'
                            : 'bg-linear-to-r from-ember-hot/60 to-transparent'
                        }`}
                      />
                      <span className={isRole ? 'text-bone' : 'text-smoke'}>
                        {copy.journey.kinds[entry.kind]}
                      </span>
                      {isHeadline ? (
                        <span className="text-flare">{copy.journey.latest}</span>
                      ) : null}
                    </div>

                    <p
                      className={`mt-[clamp(0.75rem,1.4vh,1.1rem)] font-mono text-[clamp(0.6875rem,0.95vw,0.8125rem)] tracking-[0.16em] ${
                        isRole ? 'text-flame' : 'text-smoke'
                      }`}
                    >
                      {item.period}
                    </p>

                    {entry.href ? (
                      <a
                        href={entry.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        data-cursor="link"
                        className={`t-heading mt-[clamp(0.4rem,0.9vh,0.7rem)] underline decoration-flame/30 decoration-1 underline-offset-[0.28em] transition-colors duration-300 hover:decoration-flare/80 ${
                          isHeadline
                            ? 'text-[clamp(1.75rem,3.6vw,3.25rem)] text-cream'
                            : isRole
                              ? 'text-[clamp(1.5rem,2.7vw,2.4rem)] text-cream'
                              : 'text-[clamp(1.25rem,1.9vw,1.65rem)] text-bone'
                        }`}
                      >
                        {entry.org}
                      </a>
                    ) : (
                      <h3
                        className={`t-heading mt-[clamp(0.4rem,0.9vh,0.7rem)] ${
                          isHeadline
                            ? 'text-[clamp(1.75rem,3.6vw,3.25rem)] text-cream'
                            : isRole
                              ? 'text-[clamp(1.5rem,2.7vw,2.4rem)] text-cream'
                              : 'text-[clamp(1.25rem,1.9vw,1.65rem)] text-bone'
                        }`}
                      >
                        {entry.org}
                      </h3>
                    )}

                    <p
                      className={`mt-[clamp(0.5rem,1vh,0.85rem)] max-w-[34ch] font-sans text-[clamp(0.9375rem,1.05vw,1.0625rem)] leading-snug ${
                        isRole ? 'text-cream/90' : 'text-bone/70'
                      }`}
                    >
                      {item.role}
                    </p>

                    <p className="t-meta mt-[clamp(0.5rem,1vh,0.8rem)]">{item.location}</p>

                    {/* .t-body is unlayered CSS and outranks any Tailwind
                        colour/size utility on the same element, so training
                        entries recede via opacity — which .t-body never sets. */}
                    <p
                      className={`t-body mt-[clamp(0.9rem,1.8vh,1.4rem)] max-w-[44ch] ${
                        isRole ? '' : 'opacity-75'
                      }`}
                    >
                      {item.body}
                    </p>
                  </article>
                </li>
              );
            })}
          </ol>
        </div>
      </Shell>
    </Section>
  );
}
