'use client';

/**
 * The title card.
 *
 * Composition, not a stack: the wordmark is set large enough to run the width of
 * the frame and she stands in front of it, so the type disappears behind her
 * shoulder and comes back out the other side. That overlap is the entire
 * difference between "a photo above a heading" and a poster.
 *
 * Everything else is placed against her: the ember pool sits where her backdrop
 * already glows, the type blocks take the two corners her plate never reaches,
 * and the scroll cue lives under the fold line she is standing on.
 */

import { useEffect, useRef } from 'react';
import { SITE } from '@/content/site';
import { EASE, gsap } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/hooks';
import { useCopy } from '@/lib/lang';
import { useSmoothScroll } from '@/lib/smooth-scroll';
import { HeroPortrait } from '@/components/sections/HeroPortrait';
import { Section } from '@/components/ui/Section';

/**
 * The camera-slate voice, hero-sized: wider tracking and a brighter ink than
 * .t-meta, which is calibrated for section labels further down the page.
 */
const SLATE = 'font-mono text-[clamp(0.625rem,0.78vw,0.8125rem)] uppercase';

/**
 * The mark is drawn as SVG rather than set as text for one practical reason:
 * at ~15vw the swap from the fallback serif to Instrument Serif changes the
 * word's width by tens of pixels, and a wordmark that resizes after load is a
 * wordmark that can overflow the viewport. A viewBox plus textLength pins the
 * width to the container and lets tracking absorb the metric difference, so it
 * fits at every breakpoint, in every font state.
 */
function Wordmark() {
  return (
    <svg
      viewBox="0 0 1000 160"
      role="img"
      aria-label={SITE.mark}
      className="block w-full"
      style={{ aspectRatio: '1000 / 160' }}
    >
      <defs>
        <linearGradient id="mookhayo-mark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--color-cream)', stopOpacity: 0.9 }} />
          <stop offset="54%" style={{ stopColor: 'var(--color-flame)', stopOpacity: 0.58 }} />
          <stop offset="100%" style={{ stopColor: 'var(--color-ember)', stopOpacity: 0.26 }} />
        </linearGradient>
      </defs>
      <text
        x="500"
        y="150"
        textAnchor="middle"
        textLength="984"
        lengthAdjust="spacing"
        fontSize="176"
        className="font-display"
        style={{ fill: 'url(#mookhayo-mark-fill)' }}
      >
        {SITE.mark}
      </text>
    </svg>
  );
}

export function Hero() {
  const copy = useCopy();
  const reduced = useReducedMotion();
  const { scrollTo } = useSmoothScroll();

  const rootRef = useRef<HTMLElement>(null);
  const markDriftRef = useRef<HTMLDivElement>(null);
  const markRiseRef = useRef<HTMLDivElement>(null);
  const plateDriftRef = useRef<HTMLDivElement>(null);
  const plateEnterRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const tickRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;

    const ctx = gsap.context(() => {
      // Entrance runs on mount, not on scroll — this is the first thing anyone
      // sees, so it cannot wait for a gesture.
      const tl = gsap.timeline({ defaults: { ease: EASE.out } });

      tl.fromTo(
        plateEnterRef.current,
        { opacity: 0, scale: 1.055, yPercent: 2.5 },
        { opacity: 1, scale: 1, yPercent: 0, duration: 1.9 },
        0,
      )
        .fromTo(markRiseRef.current, { yPercent: 115 }, { yPercent: 0, duration: 1.5 }, 0.22)
        .fromTo(
          '[data-hero-line]',
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 1.15, stagger: 0.085 },
          0.5,
        );

      // Fresh config per tween: ScrollTrigger takes ownership of the object.
      const drift = () => ({
        trigger: root,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.5,
      });

      // Leaving the hero, the type outruns her — the parallax that sells the
      // depth between them. Never pinned: the rest of the page owns the scroll.
      gsap.to(markDriftRef.current, { yPercent: -68, opacity: 0, ease: 'none', scrollTrigger: drift() });
      gsap.to(plateDriftRef.current, { yPercent: -14, opacity: 0.06, ease: 'none', scrollTrigger: drift() });
      gsap.to(textRef.current, { yPercent: -6, opacity: 0, ease: 'none', scrollTrigger: drift() });

      const cue = gsap.timeline({ repeat: -1, repeatDelay: 0.55, delay: 1.6 });
      cue
        .fromTo(tickRef.current, { yPercent: -100, opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'none' }, 0)
        .to(tickRef.current, { yPercent: 230, duration: 1.3, ease: 'power1.in' }, 0)
        .to(tickRef.current, { opacity: 0, duration: 0.42 }, 0.88);
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  const goDown = () => {
    const intro = document.querySelector<HTMLElement>('#intro');
    // Falls back to one screen down so the cue is never a decoration.
    scrollTo(intro ?? window.innerHeight);
  };

  return (
    <Section
      id="hero"
      pad="none"
      ref={rootRef}
      className="min-h-[100svh] overflow-clip [--hero-x:50%] md:[--hero-x:61%]"
    >
      {/* The pool her backdrop is already lit by, continued into the page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(46% 40% at var(--hero-x) 54%, rgba(168,72,10,0.30) 0%, rgba(135,55,3,0.13) 42%, rgba(86,35,1,0.04) 68%, transparent 84%)',
        }}
      />

      {/* The mark, behind her. Anchored from the BOTTOM so it crosses her chest
          and arms at every viewport height instead of climbing onto her face.
          The right padding is the nav rail's lane: the mark may bleed past the
          text column, but never underneath the chrome. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[26vh] z-10 px-[3vw] md:bottom-[23vh] md:pr-[calc(var(--rail-w)+2vw)]">
        {/* Width drives the mark's size, height drives hers — so the vh cap is
            what keeps the two in proportion on a short, wide window. */}
        <div ref={markDriftRef} className="mx-auto w-full max-w-[min(96rem,155vh)]">
          <div className="overflow-hidden">
            <div ref={markRiseRef}>
              <Wordmark />
            </div>
          </div>
        </div>
      </div>

      {/* Her plate. Bottom-anchored: she stands on the fold. */}
      <div className="absolute bottom-0 left-[var(--hero-x)] z-20 h-[clamp(24rem,84vh,44rem)] -translate-x-1/2 aspect-[859/1831] md:h-[clamp(26rem,80vh,56rem)]">
        <div ref={plateDriftRef} className="h-full w-full">
          <div ref={plateEnterRef} className="h-full w-full">
            <HeroPortrait />
          </div>
        </div>
      </div>

      {/* Scrim: holds the type legible where it crosses her on small screens,
          and lands her feet in the dark instead of on a hard crop. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[21] h-[44vh] bg-linear-to-t from-void via-void/70 to-transparent md:h-[32vh] md:via-void/40"
      />

      <div ref={textRef} className="absolute inset-0 z-30 flex flex-col justify-between">
        <div className="mx-auto w-full max-w-[110rem] px-[var(--shell-x)] pt-[clamp(5.5rem,13vh,9rem)]">
          <h1
            data-hero-line
            className={`${SLATE} tracking-[0.4em] text-cream`}
          >
            {copy.hero.name}
          </h1>

          <ul data-hero-line className="mt-[clamp(0.75rem,1.6vh,1.25rem)] flex flex-wrap items-center gap-x-3 gap-y-2">
            {copy.hero.roles.map((role, i) => (
              <li key={role} className="flex items-center gap-3">
                {i > 0 ? <span aria-hidden className="block h-2.5 w-px bg-flame/40" /> : null}
                <span className={`${SLATE} tracking-[0.24em] text-bone`}>{role}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto w-full max-w-[110rem] px-[var(--shell-x)] pb-[clamp(1.75rem,4.5vh,3.25rem)]">
          <div className="flex flex-col gap-[clamp(1.5rem,3.5vh,2.5rem)] md:flex-row md:items-end md:justify-between md:gap-16">
            <div>
              <p
                data-hero-line
                className="t-heading max-w-[27ch] text-[clamp(1.35rem,2.5vw,2.25rem)] italic text-cream"
              >
                {copy.hero.tagline}
              </p>

              <div
                data-hero-line
                className="mt-[clamp(1rem,2.2vh,1.5rem)] flex flex-wrap items-center gap-x-4 gap-y-2"
              >
                <span className="t-meta">{copy.hero.based}</span>
                {/* The rule travels with the phrase it introduces, so a wrap can
                    never leave it dangling at the end of a line. */}
                <span className="flex items-center gap-4">
                  <span aria-hidden className="block h-2.5 w-px bg-flame/30" />
                  <span className="t-meta">{copy.hero.experience}</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={goDown}
              data-hero-line
              data-cursor="link"
              aria-label={copy.a11y.scrollHint}
              className="group flex shrink-0 items-center gap-4 self-start md:self-end"
            >
              <span className="t-meta transition-colors duration-300 group-hover:text-cream">
                {copy.hero.scroll}
              </span>
              <span aria-hidden className="relative block h-9 w-px overflow-hidden bg-cream/15">
                <span
                  ref={tickRef}
                  className="absolute inset-x-0 top-0 block h-1/2 bg-linear-to-b from-transparent via-flare to-transparent"
                />
              </span>
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}
