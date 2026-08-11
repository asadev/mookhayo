'use client';

/**
 * Selected work.
 *
 * The gallery below is built for the day PROJECTS has footage in it, and it
 * switches on by itself — filters, masonry, hover playback and the lightbox
 * all derive from the array. Nothing here needs editing when the media lands.
 *
 * Today PROJECTS is empty, so the section renders a slate instead. Deliberately
 * NOT card skeletons: skeletons say "loading", and nothing is loading — the work
 * simply has not been published yet. Saying that plainly, inside the same frame
 * language as the reel gate, is the honest version and the better-looking one.
 */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import { PROJECTS, WORK_CATEGORIES, type Project, type WorkCategory } from '@/content/site';
import { gsap, EASE } from '@/lib/gsap';
import { useFinePointer, useMediaQuery, useReducedMotion } from '@/lib/hooks';
import { useCopy } from '@/lib/lang';
import { useSmoothScroll } from '@/lib/smooth-scroll';
import { Reveal, RevealGroup } from '@/components/ui/Reveal';
import { Section, Shell } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';

type Filter = WorkCategory | 'all';

/** How far the grid is allowed to bend under fast scrolling. Past ~4deg it stops
 *  reading as weight and starts reading as a rendering bug. */
const MAX_SKEW = 4;

/** useLayoutEffect warns during SSR; the measurement it does is meaningless there. */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Headings live in site.ts as one string per language, so the line break has to
 * be computed rather than hand-placed — a hardcoded split would only ever be
 * right for English. Breaks nearest the optical centre, preferring punctuation.
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

/**
 * Column-packed masonry rather than a fixed grid.
 *
 * A 9:16 Reel is three times taller than a 16:9 frame at the same width. In a
 * row-based grid that leaves holes under every landscape card; packing by
 * running column height keeps both shapes at their true ratio with no gaps and
 * no cropping.
 */
function distribute(items: Project[], cols: number): Project[][] {
  const columns: Project[][] = Array.from({ length: cols }, () => []);
  const heights: number[] = Array.from({ length: cols }, () => 0);

  for (const item of items) {
    const ratio = item.ratio > 0 ? item.ratio : 16 / 9;
    let target = 0;
    for (let i = 1; i < cols; i += 1) {
      if (heights[i] < heights[target]) target = i;
    }
    columns[target].push(item);
    heights[target] += 1 / ratio + 0.1; // + gap, so tall columns stop attracting cards
  }

  return columns;
}

/** Registration marks — same corner language as the reel gate. */
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

/* ------------------------------------------------------------------ *
 * Awaiting-media state — today
 * ------------------------------------------------------------------ */

function WorkSlate() {
  const copy = useCopy();

  return (
    <div className="relative overflow-hidden rounded-[4px] bg-linear-to-b from-ink to-void px-[clamp(1.5rem,5vw,5rem)] pb-[clamp(2.25rem,5vh,3.5rem)] pt-[clamp(3.5rem,8vh,5.5rem)] shadow-[inset_0_0_0_1px_rgba(245,235,226,0.06),0_40px_120px_-60px_rgba(0,0,0,0.95)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(70% 70% at 50% 28%, rgba(168,72,10,0.24) 0%, rgba(86,35,1,0.11) 46%, transparent 78%)',
        }}
      />

      <CornerMarks />

      <div className="relative flex flex-col items-center text-center">
        <h3 className="t-heading text-[clamp(1.5rem,3.4vw,2.75rem)] text-cream">
          {copy.work.pending.title}
        </h3>
        <p className="t-body mt-[clamp(0.875rem,2vh,1.25rem)] max-w-[52ch]">
          {copy.work.pending.body}
        </p>
      </div>

      {/* an empty timeline ruler: the sequence exists, the clips are not cut in yet */}
      <div className="relative mt-[clamp(2rem,5vh,3rem)]">
        <div
          aria-hidden
          className="h-[clamp(1.25rem,2.5vw,2rem)] w-full"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to right, rgba(202,116,59,0.30) 0 1px, transparent 1px 14px)',
            maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
          }}
        />
        <div aria-hidden className="hairline mt-[2px]" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Card
 * ------------------------------------------------------------------ */

function WorkCard({
  project,
  label,
  caption,
  onOpen,
}: {
  project: Project;
  /** Full accessible name, year included. */
  label: string;
  /** What the slate shows — the year is already set beside it, so it isn't repeated here. */
  caption: string;
  onOpen: (project: Project) => void;
}) {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Off-screen video is decode budget spent on nobody. On touch there is no
  // hover to trigger playback at all, so in-view becomes the honest trigger.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) video.pause();
        else if (!fine && !reduced) void video.play().catch(() => {});
      },
      { threshold: 0.3 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, [fine, reduced]);

  const onEnter = () => {
    if (!fine) return;
    void videoRef.current?.play().catch(() => {});
  };

  const onLeave = () => {
    if (!fine) return;
    videoRef.current?.pause();
  };

  return (
    <button
      type="button"
      data-card={project.id}
      data-cursor="view"
      aria-label={label}
      onClick={() => onOpen(project)}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      className="group relative block w-full overflow-hidden rounded-[3px] bg-ink text-left shadow-[inset_0_0_0_1px_rgba(245,235,226,0.06)]"
      style={{ aspectRatio: String(project.ratio > 0 ? project.ratio : 16 / 9) }}
    >
      {project.kind === 'video' ? (
        <video
          ref={videoRef}
          src={project.src}
          poster={project.poster}
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
        />
      ) : (
        <Image
          src={project.src}
          alt=""
          fill
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
          className="object-cover transition-transform duration-[900ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
        />
      )}

      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-void/85 via-void/10 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100"
      />

      {/* colour sits on the inner span, never on .t-meta itself: globals.css
          declares .t-meta outside a cascade layer, so it beats the utilities */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-baseline gap-2 p-[clamp(0.75rem,1.6vw,1.25rem)] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:-translate-y-[2px]">
        <span className="t-meta shrink-0">
          <span className="text-flame">{project.year}</span>
        </span>
        <span aria-hidden className="h-px w-4 shrink-0 translate-y-[-3px] bg-flame/40" />
        <span className="t-meta truncate-1">
          <span className="text-bone">{caption}</span>
        </span>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Lightbox — what data-cursor="view" actually opens
 * ------------------------------------------------------------------ */

function WorkLightbox({
  project,
  label,
  onClose,
}: {
  project: Project;
  label: string;
  onClose: () => void;
}) {
  const copy = useCopy();
  const { lockScroll, unlockScroll } = useSmoothScroll();
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const ratio = project.ratio > 0 ? project.ratio : 16 / 9;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    closeRef.current?.focus();

    // The provider owns the lock: it knows whether Lenis is up, and it
    // reference-counts, so opening this from inside the mobile menu doesn't
    // release the page when only one of the two closes.
    lockScroll();

    return () => {
      document.removeEventListener('keydown', onKey);
      unlockScroll();
    };
  }, [lockScroll, unlockScroll, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[95] flex items-center justify-center p-[clamp(1rem,4vw,3rem)]"
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-void/90 backdrop-blur-xl"
      />

      {/* the panel hugs the media instead of framing it in black: a 9:16 Reel and
          a 16:9 frame both get a snug glass surround at the same viewport height */}
      <div
        className="glass relative z-10 w-full rounded-[6px] p-[clamp(0.75rem,1.4vw,1.25rem)]"
        style={{ maxWidth: `min(76rem, calc(74vh * ${ratio}))` }}
      >
        <div
          className="flex w-full items-center justify-center overflow-hidden rounded-[3px] bg-void"
          style={{ aspectRatio: String(ratio) }}
        >
          {project.kind === 'video' ? (
            <video
              src={project.src}
              poster={project.poster}
              controls
              autoPlay
              loop
              muted
              playsInline
              className="max-h-[74vh] w-auto max-w-full object-contain"
            />
          ) : (
            <Image
              src={project.src}
              alt=""
              width={1600}
              height={Math.round(1600 / ratio)}
              sizes="90vw"
              className="max-h-[74vh] w-auto max-w-full object-contain"
            />
          )}
        </div>

        <p id={titleId} className="t-meta truncate-1 mt-[clamp(0.75rem,1.4vw,1.125rem)]">
          <span className="text-bone">{label}</span>
        </p>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={copy.a11y.close}
          className="glass-chrome absolute -top-3 right-[clamp(0.75rem,1.4vw,1.25rem)] grid h-11 w-11 place-items-center rounded-full"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 stroke-cream" strokeWidth="1.4">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Gallery
 * ------------------------------------------------------------------ */

function WorkGallery() {
  const copy = useCopy();
  const reduced = useReducedMotion();
  const { velocityRef } = useSmoothScroll();

  const wide = useMediaQuery('(min-width: 1024px)');
  const medium = useMediaQuery('(min-width: 640px)');
  const cols = wide ? 3 : medium ? 2 : 1;

  const [active, setActive] = useState<Filter>('all');
  const [open, setOpen] = useState<Project | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  /** Card rects captured immediately before a filter commits, for the FLIP back. */
  const lastRects = useRef(new Map<string, DOMRect>());
  /** The exit fade, held so a second click can cancel the first one's effects. */
  const exitTween = useRef<gsap.core.Tween | null>(null);

  /**
   * Abandon an in-flight exit fade and undo what it dimmed.
   *
   * Without this, clicking a second chip mid-fade left the first tween running
   * over cards the new filter keeps — they finished at opacity 0 and stayed
   * invisible — and its onComplete then snapped the filter back to the chip
   * that had already been superseded. revert() both kills it and restores the
   * inline styles it wrote.
   */
  const clearExit = useCallback(() => {
    exitTween.current?.revert();
    exitTween.current = null;
  }, []);

  // A fade must not outlive the section that started it: onComplete sets state.
  useEffect(() => clearExit, [clearExit]);

  // Only offer a chip that has something behind it — a filter that resolves to
  // nothing is a dead affordance wearing a hover state.
  const available = useMemo(
    () => WORK_CATEGORIES.filter((c) => PROJECTS.some((p) => p.category === c)),
    [],
  );

  const filtered = useMemo(
    () => (active === 'all' ? PROJECTS : PROJECTS.filter((p) => p.category === active)),
    [active],
  );

  const columns = useMemo(() => distribute(filtered, cols), [filtered, cols]);

  const captionFor = useCallback(
    (project: Project) =>
      [copy.work.categories[project.category], project.client].filter(Boolean).join(' · '),
    [copy],
  );

  const labelFor = useCallback(
    (project: Project) => `${captionFor(project)} · ${project.year}`,
    [captionFor],
  );

  /** Stable, so the lightbox's effect does not re-run — and re-steal focus —
   *  every time this section happens to re-render behind it. */
  const closeLightbox = useCallback(() => setOpen(null), []);

  const countFor = useCallback(
    (filter: Filter) =>
      filter === 'all' ? PROJECTS.length : PROJECTS.filter((p) => p.category === filter).length,
    [],
  );

  const changeFilter = (next: Filter) => {
    // Before the early return, not after: clicking back onto the active chip
    // while a fade is running is exactly the case that used to strand it.
    clearExit();
    if (next === active) return;

    const grid = gridRef.current;
    if (grid) {
      lastRects.current.clear();
      grid.querySelectorAll<HTMLElement>('[data-card]').forEach((card) => {
        if (card.dataset.card) lastRects.current.set(card.dataset.card, card.getBoundingClientRect());
      });
    }

    if (reduced || !grid) {
      setActive(next);
      return;
    }

    // Cards that are about to leave get a real exit before the layout collapses
    // under them — otherwise they vanish mid-frame and the FLIP looks like a jump.
    const leaving = Array.from(grid.querySelectorAll<HTMLElement>('[data-card]')).filter((card) => {
      const project = PROJECTS.find((p) => p.id === card.dataset.card);
      return Boolean(project) && next !== 'all' && project?.category !== next;
    });

    if (!leaving.length) {
      setActive(next);
      return;
    }

    exitTween.current = gsap.to(leaving, {
      opacity: 0,
      scale: 0.96,
      duration: 0.28,
      ease: EASE.soft,
      onComplete: () => {
        exitTween.current = null;
        setActive(next);
      },
    });
  };

  // FLIP: survivors slide from where they were, arrivals fade up.
  useIsomorphicLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid || reduced) return;

    const previous = lastRects.current;
    if (!previous.size) return; // first paint — RevealGroup owns that entrance

    const ctx = gsap.context(() => {
      grid.querySelectorAll<HTMLElement>('[data-card]').forEach((card) => {
        const id = card.dataset.card;
        if (!id) return;
        const before = previous.get(id);
        const after = card.getBoundingClientRect();

        if (before) {
          const dx = before.left - after.left;
          const dy = before.top - after.top;
          if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
            gsap.fromTo(card, { x: dx, y: dy }, { x: 0, y: 0, duration: 0.75, ease: EASE.out });
          }
        } else {
          gsap.fromTo(
            card,
            { opacity: 0, scale: 0.94, y: 20 },
            { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: EASE.out },
          );
        }
      });
    }, grid);

    previous.clear();
    return () => ctx.revert();
  }, [columns, reduced]);

  // Scroll velocity bends the grid. Lenis already exposes a normalised, signed
  // velocity, so this only has to smooth it and cap it — the settle back to
  // zero is what sells the weight, not the bend itself.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || reduced) return;

    let raf = 0;
    let current = 0;
    let sampled = 0;
    let lastReading = 0;
    let visible = true;

    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), {
      rootMargin: '25% 0px',
    });
    io.observe(grid);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;

      // velocityRef only changes while Lenis is emitting scroll events, and its
      // final reading is not zero — so an unchanged value means scrolling has
      // stopped, and the bend has to be decayed here or the grid stays skewed.
      const reading = velocityRef.current;
      if (reading !== lastReading) {
        sampled = reading;
        lastReading = reading;
      } else {
        sampled *= 0.86;
      }

      const target = gsap.utils.clamp(-1, 1, sampled) * MAX_SKEW;
      current += (target - current) * 0.1;
      if (Math.abs(current) < 0.002) current = 0;

      grid.style.transform =
        current === 0 ? '' : `skewY(${current.toFixed(3)}deg) scale(${1 - Math.abs(current) * 0.004})`;
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      grid.style.transform = '';
    };
  }, [reduced, velocityRef]);

  // With one populated category, "All" and that chip resolve to the same set —
  // two controls doing one thing. Show the row only when it can actually sort.
  const chips: Filter[] = available.length > 1 ? ['all', ...available] : [];

  return (
    <>
      {chips.length ? (
        <Reveal className="mt-[clamp(2rem,5vh,3.5rem)]" y={20}>
          <div className="-mx-[var(--shell-x)] overflow-x-auto px-[var(--shell-x)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max items-center gap-2">
              {chips.map((chip) => {
                const isActive = chip === active;
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => changeFilter(chip)}
                    aria-pressed={isActive}
                    className={`t-meta group flex min-h-11 items-center gap-2 rounded-full px-4 ${
                      isActive ? 'glass-chrome' : ''
                    }`}
                  >
                    <span
                      className={`transition-colors duration-300 ${
                        isActive ? 'text-cream' : 'text-smoke group-hover:text-bone'
                      }`}
                    >
                      {chip === 'all' ? copy.work.all : copy.work.categories[chip]}
                    </span>
                    <span className={isActive ? 'text-flame' : 'text-smoke/60'}>
                      {String(countFor(chip)).padStart(2, '0')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>
      ) : null}

      <RevealGroup
        className="mt-[clamp(1.5rem,4vh,2.5rem)]"
        selector="[data-card]"
        y={34}
        stagger={0.06}
      >
        <div
          ref={gridRef}
          className="grid gap-[clamp(0.75rem,1.6vw,1.5rem)] will-change-transform"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {columns.map((column, i) => (
            <div key={i} className="flex flex-col gap-[clamp(0.75rem,1.6vw,1.5rem)]">
              {column.map((project) => (
                <WorkCard
                  key={project.id}
                  project={project}
                  label={labelFor(project)}
                  caption={captionFor(project)}
                  onOpen={setOpen}
                />
              ))}
            </div>
          ))}
        </div>
      </RevealGroup>

      {open ? (
        <WorkLightbox project={open} label={labelFor(open)} onClose={closeLightbox} />
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Section
 * ------------------------------------------------------------------ */

export function Work() {
  const copy = useCopy();

  return (
    <Section id="work">
      <Shell>
        <SectionHeader
          id="work"
          eyebrow={copy.work.eyebrow}
          headingLines={headingLines(copy.work.heading)}
          body={copy.work.body}
        />

        {PROJECTS.length > 0 ? (
          <WorkGallery />
        ) : (
          <Reveal className="mt-[clamp(2.5rem,6vh,4.5rem)]" y={40}>
            <WorkSlate />
          </Reveal>
        )}
      </Shell>
    </Section>
  );
}
