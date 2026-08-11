'use client';

/**
 * Credentials.
 *
 * Two of the three scans have not arrived from the client yet. They are neither
 * hidden nor faked: those cards keep the exact same silhouette and say so in the
 * slate voice, so the set reads as "one page still in the post" rather than as a
 * section with holes punched in it.
 *
 * Only a card with a real scan behind it gets a hover, a lift and a cursor
 * change. An affordance here is a promise that something opens.
 *
 * The scans themselves are dark navy and bright green — they fight this palette,
 * and there is no honest way to recolour somebody else's certificate. So each one
 * is matted inside a neutral glass frame with a lot of padding, which turns the
 * clash into "a document lying on a table" instead of a mistake.
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { CERTIFICATES, type Certificate } from '@/content/site';
import { Section, Shell } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { RevealGroup } from '@/components/ui/Reveal';
import { useCopy } from '@/lib/lang';
import { useReducedMotion } from '@/lib/hooks';
import { useSmoothScroll } from '@/lib/smooth-scroll';
import { gsap, EASE } from '@/lib/gsap';

/** A certificate we can actually open — narrowed once, used everywhere. */
type ScannedCertificate = Certificate & { image: string; thumb: string };

function hasScan(cert: Certificate): cert is ScannedCertificate {
  return typeof cert.image === 'string' && typeof cert.thumb === 'string';
}

/**
 * Headlines are set as separate masked lines, so the break is a decision rather
 * than whatever the viewport does. Every language writes the clause break at the
 * comma; where there isn't one, balance the words across two lines.
 */
function splitHeading(heading: string): string[] {
  const comma = heading.indexOf(',');
  if (comma > 0 && comma < heading.length - 2) {
    return [heading.slice(0, comma + 1), heading.slice(comma + 1).trim()];
  }
  const words = heading.split(' ');
  if (words.length < 4) return [heading];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

/** Hand-set tilts. A repeating pattern reads as "stacked by a person", not by a grid. */
const TILT = [-1.6, 1.2, -0.7];

const GLOW =
  'radial-gradient(58% 52% at 50% 38%, rgba(168,72,10,0.34), rgba(86,35,1,0.14) 55%, transparent 78%)';

export function Certificates() {
  const copy = useCopy();
  const [openId, setOpenId] = useState<string | null>(null);

  const openCert = useCallback((id: string) => setOpenId(id), []);
  const closeCert = useCallback(() => setOpenId(null), []);

  const active = CERTIFICATES.filter(hasScan).find((cert) => cert.id === openId) ?? null;

  return (
    <Section id="certificates">
      <Shell>
        <SectionHeader
          id="certificates"
          eyebrow={copy.certificates.eyebrow}
          headingLines={splitHeading(copy.certificates.heading)}
          body={copy.certificates.body}
        />

        <RevealGroup
          as="ul"
          className="mt-[clamp(3rem,7vh,5rem)] grid grid-cols-1 gap-x-[clamp(1.5rem,3.5vw,3rem)] gap-y-[clamp(3rem,6vh,4.5rem)] sm:grid-cols-2 lg:grid-cols-3"
          y={34}
          stagger={0.1}
        >
          {CERTIFICATES.map((cert, i) => (
            <CertificateCard
              key={cert.id}
              cert={cert}
              tilt={TILT[i % TILT.length]}
              onOpen={openCert}
            />
          ))}
        </RevealGroup>
      </Shell>

      {active ? <Lightbox cert={active} onClose={closeCert} /> : null}
    </Section>
  );
}

function CertificateCard({
  cert,
  tilt,
  onOpen,
}: {
  cert: Certificate;
  tilt: number;
  onOpen: (id: string) => void;
}) {
  const copy = useCopy();
  const item = copy.certificates.items[cert.id];
  if (!item) return null;

  const scan = hasScan(cert) ? cert : null;

  /* The frame is identical either way — that is what makes the missing scans read
     as deliberate. Only its contents differ. */
  const frame = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-5 z-0 blur-2xl"
        style={{ background: GLOW, opacity: scan ? 0.75 : 0.32 }}
      />
      <div
        className="glass relative z-10 rounded-[1.25rem] p-[clamp(0.85rem,2.2vw,1.35rem)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-2"
        style={{ rotate: `${tilt}deg` }}
      >
        <div className="relative aspect-[1054/1492] w-full overflow-hidden rounded-[0.6rem] bg-ink/70">
          {scan ? (
            <Image
              src={scan.thumb}
              alt={`${cert.org} — ${item.qualification}`}
              fill
              sizes="(max-width: 639px) 78vw, (max-width: 1023px) 42vw, 24rem"
              className="object-contain"
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center px-5 text-center font-mono text-[0.68rem] uppercase leading-[1.8] tracking-[0.18em] text-smoke">
              {copy.certificates.pending}
            </span>
          )}

          {/* A caption bar, not a floating pill: the scan is busy artwork and any
              chip laid over it loses. A gradient foot gives the label a surface to
              sit on, and it stays legible without a hover — the only version that
              works on touch. */}
          {scan ? (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end px-4 pb-3.5 pt-14 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-bone transition-colors duration-500 group-hover:text-cream"
              style={{
                background:
                  'linear-gradient(to top, rgba(6,3,1,0.92) 0%, rgba(6,3,1,0.6) 42%, transparent 100%)',
              }}
            >
              {copy.certificates.view}
            </span>
          ) : null}
        </div>
      </div>
    </>
  );

  const meta = (
    <div className="mt-[clamp(1.25rem,2.4vh,1.75rem)] flex flex-col gap-2.5">
      <span className="t-meta flex items-center gap-2.5">
        <span className="shrink-0 text-ember-hot">{cert.year}</span>
        <span
          aria-hidden
          className="h-px w-6 shrink-0 bg-linear-to-r from-ember-hot/70 to-transparent"
        />
        <span className="truncate-1">{item.location}</span>
      </span>

      {/* Both blocks reserve their full two lines. One organisation name wraps and
          the others don't, and without this the qualifications and the slate rows
          below sit at three different heights across the grid. */}
      <h3 className="t-heading truncate-2 min-h-[1.96em] text-[clamp(1.15rem,2.1vw,1.45rem)] text-cream">
        {cert.org}
      </h3>

      <p className="truncate-2 min-h-[3.25em] font-sans text-[0.95rem] leading-relaxed text-bone">
        {item.qualification}
      </p>

      {cert.ref || cert.issued ? (
        <dl className="mt-1 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[0.63rem] uppercase tracking-[0.16em] text-smoke">
          {cert.ref ? (
            <div className="flex min-w-0 gap-1.5">
              <dt>{copy.certificates.ref}</dt>
              <dd className="truncate-1 text-bone">{cert.ref}</dd>
            </div>
          ) : null}
          {cert.issued ? (
            <div className="flex min-w-0 gap-1.5">
              <dt>{copy.certificates.issued}</dt>
              <dd className="truncate-1 text-bone">{cert.issued}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </div>
  );

  return (
    <li className="relative isolate mx-auto w-full max-w-[20rem] sm:max-w-none">
      {scan ? (
        /* Only the frame is the button. Keeping the metadata outside means the
           accessible name stays "View certificate — <org>" without swallowing
           the text a screen reader should still be able to read normally. */
        <button
          type="button"
          onClick={() => onOpen(cert.id)}
          data-cursor="view"
          aria-label={`${copy.certificates.view} — ${cert.org}`}
          className="group relative block w-full cursor-pointer"
        >
          {frame}
        </button>
      ) : (
        <div className="relative">{frame}</div>
      )}
      {meta}
    </li>
  );
}

function Lightbox({ cert, onClose }: { cert: ScannedCertificate; onClose: () => void }) {
  const copy = useCopy();
  const reduced = useReducedMotion();
  const { lockScroll, unlockScroll } = useSmoothScroll();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const item = copy.certificates.items[cert.id];

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;

    // The provider handles both cases — Lenis stopped when it's running, the
    // document frozen when it isn't (reduced motion never boots Lenis).
    lockScroll();

    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      unlockScroll();
      previous?.focus?.();
    };
  }, [lockScroll, unlockScroll, onClose]);

  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-lightbox-scrim]', { opacity: 0 }, { opacity: 1, duration: 0.45, ease: EASE.soft });
      gsap.fromTo(
        '[data-lightbox-panel]',
        { opacity: 0, y: 26, scale: 0.985 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: EASE.out },
      );
    }, dialogRef);
    return () => ctx.revert();
  }, [reduced]);

  if (!item) return null;

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[95] flex items-center justify-center p-[clamp(0.9rem,3vw,2.5rem)]"
    >
      {/* A real button, not a div with a click handler — the backdrop is the
          fastest way out and keyboard users get it as a labelled control. */}
      <button
        type="button"
        data-lightbox-scrim
        data-cursor="link"
        aria-label={copy.a11y.close}
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-void/88 backdrop-blur-md"
      />

      {/* Width hugs the document rather than filling a fixed column — a portrait
          scan floating in the middle of a 46rem panel reads as a layout accident
          rather than as matting. */}
      <div
        data-lightbox-panel
        className="glass relative z-10 flex max-h-full w-auto max-w-[min(46rem,100%)] flex-col gap-[clamp(0.9rem,2vw,1.4rem)] overflow-y-auto rounded-[1.25rem] p-[clamp(0.9rem,2.6vw,1.75rem)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="t-meta flex items-center gap-2.5">
              <span className="shrink-0 text-ember-hot">{cert.year}</span>
              <span className="truncate-1">{item.location}</span>
            </span>
            <h3
              id={titleId}
              className="t-heading truncate-2 text-[clamp(1.15rem,2.4vw,1.6rem)] text-cream"
            >
              {cert.org}
            </h3>
            <p className="truncate-2 font-sans text-[0.9rem] leading-relaxed text-bone">
              {item.qualification}
            </p>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            data-cursor="link"
            aria-label={copy.a11y.close}
            className="glass-chrome grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full text-bone transition-colors duration-300 hover:text-cream"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M5 5l14 14M19 5L5 19" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* The mat: neutral, generous, and deliberately not tinted ember. */}
        <div className="flex items-center justify-center rounded-[0.75rem] bg-ink/70 p-[clamp(0.75rem,2.4vw,1.5rem)]">
          {/* `priority`, not lazy. The panel hugs the document, so before the
              file lands the img box is 0×0 — and a lazy image that is 0×0 is
              never "in view", so it never requests, so it stays 0×0. On mobile
              that deadlock left the lightbox permanently empty. This is also the
              one image on the page the visitor has explicitly asked to see. */}
          <Image
            src={cert.image}
            alt={`${cert.org} — ${item.qualification}`}
            width={1054}
            height={1492}
            priority
            sizes="(max-width: 768px) 88vw, 42rem"
            className="h-auto max-h-[62vh] w-auto max-w-full object-contain"
          />
        </div>

        {cert.ref || cert.issued ? (
          <dl className="flex flex-wrap gap-x-6 gap-y-1.5 font-mono text-[0.63rem] uppercase tracking-[0.16em] text-smoke">
            {cert.ref ? (
              <div className="flex min-w-0 gap-1.5">
                <dt>{copy.certificates.ref}</dt>
                <dd className="truncate-1 text-bone">{cert.ref}</dd>
              </div>
            ) : null}
            {cert.issued ? (
              <div className="flex min-w-0 gap-1.5">
                <dt>{copy.certificates.issued}</dt>
                <dd className="truncate-1 text-bone">{cert.issued}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
