'use client';

/**
 * INTRO — the manifesto, staged as a title card rather than an About box.
 *
 * Two blocks pulling against each other: the statement at full display size on
 * the left edge, then the prose dropped well below and pushed right. A centred
 * or stacked version of this reads like a CV; the offset is what makes it read
 * like a title sequence.
 *
 * The signature move is the scrub-lit paragraph. Every word starts dim and is
 * brought up to full as the block crosses the middle of the viewport, so the
 * text reads like a light being walked across it — the same gesture she spends
 * her working life making.
 *
 * Why opacity and not colour: cream at low alpha over the void resolves to
 * almost exactly `smoke`, so the look is identical — but a colour tween has to
 * re-interpolate and re-serialise an rgb string for every word on every scrub
 * frame, and there are ~110 words here. One numeric write per word is the
 * cheap version of the same picture.
 */

import { useEffect, useRef } from 'react';
import { MaskLines, Reveal } from '@/components/ui/Reveal';
import { Section, Shell, sectionIndex } from '@/components/ui/Section';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/hooks';
import { useCopy } from '@/lib/lang';

/**
 * How far down a word starts. Dim enough to be clearly unlit, never invisible.
 *
 * 0.49 is not arbitrary: cream (#f5ebe2) at that alpha over the void (#060301)
 * composites to rgb(126,119,114), which is `smoke` (#7b6c60) to the eye — the
 * unlit colour the design calls for. Lower values look like the same idea but
 * are not: 0.2 lands on rgb(54,49,46), a 1.6:1 contrast that reads as blank
 * page rather than as unlit text.
 */
const UNLIT = 0.49;

/**
 * One sentence per line.
 *
 * Line breaks in a display heading are editorial, but this heading exists in
 * three languages of different lengths — a hand-picked word index would be
 * right in one and wrong in two. All three write it as two short statements,
 * so the sentence boundary is the break that survives translation.
 */
function toLines(heading: string): string[] {
  const parts = heading.match(/[^.!?]+[.!?]*/g);
  if (!parts) return [heading];
  const lines = parts.map((part) => part.trim()).filter(Boolean);
  return lines.length ? lines : [heading];
}

/**
 * Split a paragraph into per-word spans for the scrub light.
 * The trailing space lives inside the span so the browser keeps its normal
 * line-breaking opportunities — wrapping must not change just because the
 * text got instrumented.
 */
function Words({ text }: { text: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((word, i) => (
        <span data-word key={`${word}-${i}`}>
          {word}
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </>
  );
}

export function Intro() {
  const copy = useCopy();
  const reduced = useReducedMotion();
  const proseRef = useRef<HTMLDivElement>(null);

  const paragraphs = copy.intro.body;

  useEffect(() => {
    const el = proseRef.current;
    // Reduced motion: the spans are already fully lit in the DOM, so doing
    // nothing here is the correct degradation — not a fallback tween.
    if (!el || reduced) return;

    const words = el.querySelectorAll<HTMLElement>('[data-word]');
    if (!words.length) return;

    const ctx = gsap.context(() => {
      // fromTo (not from) so the unlit state is written by JS at trigger init.
      // Nothing in CSS is allowed to dim this text — a JS failure has to leave
      // a readable paragraph, not a grey one.
      gsap.fromTo(
        words,
        { opacity: UNLIT },
        {
          opacity: 1,
          ease: 'none',
          // Short duration against a long stagger = a narrow travelling band
          // rather than the whole block fading up together.
          duration: 0.4,
          stagger: { each: 0.05 },
          scrollTrigger: {
            trigger: el,
            start: 'top 80%',
            end: 'bottom 55%',
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        },
      );
    }, el);

    return () => {
      ctx.revert();
      // The word count — and therefore this block's height — changes with the
      // language, so every trigger below it has to re-measure.
      ScrollTrigger.refresh();
    };
  }, [reduced, paragraphs]);

  return (
    <Section id="intro">
      <Shell>
        <Reveal className="mb-[clamp(1.5rem,3vh,2.5rem)]" y={16}>
          <span className="t-meta inline-flex items-center gap-3">
            <span className="text-ember-hot">{sectionIndex('intro')}</span>
            <span
              aria-hidden
              className="inline-block h-px w-8 bg-linear-to-r from-ember-hot/70 to-transparent"
            />
            {copy.intro.eyebrow}
          </span>
        </Reveal>

        <MaskLines
          lines={toLines(copy.intro.heading)}
          className="t-display text-[clamp(2.125rem,7.4vw,6.5rem)] text-cream"
        />

        {/* Prose dropped low and pushed right — the tension against the title. */}
        <div className="mt-[clamp(2.5rem,9vh,7rem)] flex justify-end">
          {/* 29rem ≈ a 46ch measure at body size. Set in rem rather than ch so
              the lead and the body paragraphs share one right edge instead of
              each resolving `ch` against its own font size. */}
          <div className="relative w-full max-w-[29rem] md:pl-9 lg:mr-[8%]">
            {/* the light source the prose hangs off */}
            <span
              aria-hidden
              className="absolute bottom-6 left-0 top-[0.55em] hidden w-px bg-linear-to-b from-ember-hot/50 via-flame/15 to-transparent md:block"
            />

            <div ref={proseRef} className="flex flex-col gap-[clamp(1.1rem,2.4vh,1.75rem)]">
              {paragraphs.map((paragraph, i) => (
                <p key={i} className={i === 0 ? 't-lead' : 't-body'}>
                  <Words text={paragraph} />
                </p>
              ))}
            </div>
          </div>
        </div>
      </Shell>
    </Section>
  );
}
