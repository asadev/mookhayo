'use client';

/**
 * Showreel.
 *
 * Two states, and exactly one value in site.ts decides which renders: the
 * moment REEL.src stops being null this section becomes a real player, with
 * no other edit anywhere.
 *
 * Until then it draws a film-leader gate. That state is deliberately NOT a
 * "video coming soon" box with a dead play button — there is nothing to play,
 * and a control that lies is worse than no control at all (prefs: no dead
 * affordances). What's drawn instead is the thing that lives in a projector
 * gate before the picture starts: registration marks, sprocket edges, a
 * leader crosshair, and one quiet line of slate copy.
 */

import { useEffect, useRef, useState } from 'react';
import { REEL } from '@/content/site';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/hooks';
import { useCopy } from '@/lib/lang';
import { Reveal } from '@/components/ui/Reveal';
import { Section, Shell } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';

/**
 * Headings live in site.ts as one string per language, so the line break has
 * to be computed rather than hand-placed — a hardcoded split would only ever
 * be right for English. Breaks nearest the optical centre, preferring a real
 * punctuation break, which is where a line wants to fall anyway.
 */
function headingLines(text: string): string[] {
  const words = text.split(' ');
  if (words.length < 3) return [text];

  const mid = text.length / 2;
  const bonus = text.length * 0.12;
  let index = 1;
  let best = Number.POSITIVE_INFINITY;
  let cursor = 0;

  for (let i = 0; i < words.length - 1; i += 1) {
    cursor += words[i].length + 1;
    const punctuated = /[,—:;.]$/.test(words[i]);
    const score = Math.abs(cursor - mid) - (punctuated ? bonus : 0);
    if (score < best) {
      best = score;
      index = i + 1;
    }
  }

  return [words.slice(0, index).join(' '), words.slice(index).join(' ')];
}

/** mm:ss. Video metadata arrives as a float and can be NaN before it loads. */
function timecode(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Registration marks — the corner brackets a frame is lined up against. */
function CornerMarks() {
  const corners = [
    'left-0 top-0',
    'right-0 top-0 rotate-90',
    'right-0 bottom-0 rotate-180',
    'left-0 bottom-0 -rotate-90',
  ];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {corners.map((pos) => (
        <svg
          key={pos}
          viewBox="0 0 28 28"
          fill="none"
          className={`absolute ${pos} m-[clamp(0.5rem,1vw,1rem)] h-[clamp(1rem,2.4vw,2rem)] w-[clamp(1rem,2.4vw,2rem)] text-flame/45`}
        >
          <path d="M0.5 11V0.5H11" stroke="currentColor" strokeWidth="1" />
          <path d="M5.5 5.5h3M5.5 5.5v3" stroke="currentColor" strokeWidth="1" opacity="0.55" />
        </svg>
      ))}
    </div>
  );
}

/** Sprocket edges. Static geometry, so it costs nothing and reads as film. */
function SprocketEdges() {
  const strip =
    'repeating-linear-gradient(to bottom, transparent 0 9px, rgba(245,235,226,0.075) 9px 21px)';

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-y-0 left-0 w-[clamp(0.5rem,1.2vw,1rem)]"
        style={{ backgroundImage: strip }}
      />
      <div
        className="absolute inset-y-0 right-0 w-[clamp(0.5rem,1.2vw,1rem)]"
        style={{ backgroundImage: strip }}
      />
    </div>
  );
}

/**
 * The slate row across the top of the gate: format left, timecode right.
 * The horizontal padding clears the corner brackets and the sprocket strip at
 * every width — on a phone those three things are within a few px of each other.
 */
function SlateRow({ left, right }: { left: string; right: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-4 px-[clamp(2.25rem,3.4vw,3rem)] py-[clamp(0.75rem,1.8vw,1.25rem)]">
      <span className="t-meta shrink-0">{left}</span>
      <span className="t-meta shrink-0">{right}</span>
    </div>
  );
}

const FRAME_SHELL =
  'relative aspect-video w-full overflow-hidden rounded-[4px] bg-linear-to-b from-ink to-void shadow-[inset_0_0_0_1px_rgba(245,235,226,0.06),0_40px_120px_-60px_rgba(0,0,0,0.95)]';

/* ------------------------------------------------------------------ *
 * Awaiting-media state — today
 * ------------------------------------------------------------------ */

function ReelLeader() {
  const copy = useCopy();
  const reduced = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || reduced) return;

    const ctx = gsap.context(() => {
      // Everything below is created paused and only runs while the gate is on
      // screen — an idle loop behind the fold is just heat.
      const sweep = gsap.timeline({ repeat: -1, repeatDelay: 1.6, repeatRefresh: true, paused: true });
      sweep
        .set('[data-reel-sweep]', { x: 0, opacity: 0 })
        .to('[data-reel-sweep]', { opacity: 1, duration: 0.6, ease: 'none' })
        .to(
          '[data-reel-sweep]',
          { x: () => frame.clientWidth, duration: 4.4, ease: 'none' },
          0,
        )
        .to('[data-reel-sweep]', { opacity: 0, duration: 0.7, ease: 'none' }, 3.7);

      const wiper = gsap.to('[data-reel-wiper]', {
        rotate: 360,
        duration: 7,
        ease: 'none',
        repeat: -1,
        svgOrigin: '80 80',
        paused: true,
      });

      const lamp = gsap.to('[data-reel-lamp]', {
        opacity: 0.55,
        scale: 1.05,
        duration: 3.4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        transformOrigin: '50% 50%',
        paused: true,
      });

      const loops = [sweep, wiper, lamp];
      ScrollTrigger.create({
        trigger: frame,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => loops.forEach((l) => (self.isActive ? l.play() : l.pause())),
      });
    }, frame);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <div ref={frameRef} className={FRAME_SHELL}>
      {/* the lamp behind the gate, warming the frame from the centre */}
      <div
        data-reel-lamp
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(56% 62% at 50% 50%, rgba(168,72,10,0.34) 0%, rgba(86,35,1,0.15) 44%, transparent 76%)',
        }}
      />

      <SprocketEdges />
      <CornerMarks />
      <SlateRow left="16:9" right="00:00:00:00" />

      {/* film-leader crosshair — a graphic, not a control */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[clamp(1rem,2.6vh,1.75rem)] px-6">
        <svg
          viewBox="0 0 160 160"
          aria-hidden
          className="h-[clamp(6rem,15vw,13rem)] w-[clamp(6rem,15vw,13rem)]"
        >
          <g data-reel-wiper>
            <path d="M80 80 L80 8 A72 72 0 0 1 152 80 Z" fill="rgba(168,72,10,0.14)" />
          </g>
          <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(202,116,59,0.28)" strokeWidth="1" />
          <circle cx="80" cy="80" r="44" fill="none" stroke="rgba(202,116,59,0.20)" strokeWidth="1" />
          <path
            d="M80 0v54M80 106v54M0 80h54M106 80h54"
            stroke="rgba(202,116,59,0.22)"
            strokeWidth="1"
          />
          <circle cx="80" cy="80" r="2.5" fill="rgba(255,158,94,0.75)" />
        </svg>

        {/* colour goes on a child, not on .t-meta itself: globals.css declares
            .t-meta outside a cascade layer, so it beats Tailwind's utilities */}
        <p className="t-meta max-w-[28ch] text-center">
          <span className="text-bone">{copy.reel.pending}</span>
        </p>
      </div>

      {/* scanning sweep */}
      <div
        data-reel-sweep
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-px opacity-0"
        style={{
          background:
            'linear-gradient(to bottom, transparent, rgba(233,133,63,0.55) 18%, rgba(255,158,94,0.75) 50%, rgba(233,133,63,0.55) 82%, transparent)',
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Real player — the instant REEL.src is a path
 * ------------------------------------------------------------------ */

function ReelPlayer({ src }: { src: string }) {
  const copy = useCopy();
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  /** What the visitor last asked for. Off-screen pausing must not overwrite it. */
  const wantsPlay = useRef(true);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [measured, setMeasured] = useState<number | null>(null);

  // Autoplay is motion the visitor did not ask for. `reduced` is false on the
  // server and on first paint — it only resolves once the media query effect
  // runs — so the attribute alone is not enough and the element is pulled back
  // here as well.
  useEffect(() => {
    if (!reduced) return;
    wantsPlay.current = false;
    videoRef.current?.pause();
  }, [reduced]);

  // A reel playing to nobody below the fold burns battery and decode budget.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) video.pause();
        // Scrolling back into view must not restart what reduced motion stopped.
        else if (wantsPlay.current && !reduced) void video.play().catch(() => {});
      },
      { threshold: 0.25 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, [reduced]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      wantsPlay.current = true;
      void video.play().catch(() => {});
    } else {
      wantsPlay.current = false;
      video.pause();
    }
  };

  const total = measured ?? null;
  const progress = total && total > 0 ? Math.min(elapsed / total, 1) : 0;
  const readout = `${timecode(elapsed)} / ${REEL.duration ?? (total !== null ? timecode(total) : '--:--')}`;

  return (
    <button
      type="button"
      onClick={toggle}
      data-cursor="play"
      aria-label={playing ? copy.reel.pause : copy.reel.play}
      className={`group block ${FRAME_SHELL}`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={REEL.poster ?? undefined}
        muted
        loop
        playsInline
        autoPlay={!reduced}
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setMeasured(e.currentTarget.duration)}
      />

      {/* keeps the slate and readout legible over any footage */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-void/55 via-transparent to-void/70"
      />

      <CornerMarks />
      <SlateRow left="16:9" right={readout} />

      {/* the control is a span: the whole frame is already the button */}
      <span className="pointer-events-none absolute inset-0 grid place-items-center">
        <span
          className={`glass-chrome grid h-[clamp(3.25rem,5vw,4.5rem)] w-[clamp(3.25rem,5vw,4.5rem)] place-items-center rounded-full transition-opacity duration-500 ${
            playing ? 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100' : 'opacity-100'
          }`}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-cream">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden className="ml-[2px] h-4 w-4 fill-cream">
              <path d="M7 4l13 8-13 8z" />
            </svg>
          )}
        </span>
      </span>

      <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-cream/10">
        <span
          className="block h-full origin-left bg-flare/80"
          style={{ transform: `scaleX(${progress})` }}
        />
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Section
 * ------------------------------------------------------------------ */

export function Reel() {
  const copy = useCopy();

  return (
    <Section id="reel">
      <Shell>
        <SectionHeader
          id="reel"
          eyebrow={copy.reel.eyebrow}
          headingLines={headingLines(copy.reel.heading)}
          body={copy.reel.body}
        />

        <Reveal className="mt-[clamp(2.5rem,6vh,4.5rem)]" y={40}>
          {REEL.src ? <ReelPlayer src={REEL.src} /> : <ReelLeader />}
        </Reveal>
      </Shell>
    </Section>
  );
}
