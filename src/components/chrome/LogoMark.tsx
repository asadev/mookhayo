'use client';

/**
 * The MOOKHAYO mark: a six-blade lens aperture.
 *
 * Chosen because it says "camera" before you've read a word, and because it
 * belongs to the same family as the registration marks and film-leader
 * perforations already used in the reel and work frames — the site had a
 * drawing language before it had a logo, and this joins it rather than
 * arriving from somewhere else.
 *
 * Filled blades, not outlines: a stroked iris disintegrates below ~24px, and
 * this has to survive a browser tab. Geometry is generated (see the aperture
 * script in the project notes) so the six blades are exactly congruent — by
 * hand they never quite are, and at large sizes the eye catches it.
 *
 * Renders in currentColor so the mark and wordmark move together on hover
 * instead of one shifting and the other sitting still.
 */

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden
      focusable="false"
      className={className}
      fill="currentColor"
    >
      <path d="M33.39 8.54A23.5 23.5 0 0 1 51.62 19.06L39.55 23.19L29.47 20.68Z" />
      <path d="M53.01 21.48A23.5 23.5 0 0 1 53.01 42.52L43.40 34.13L40.54 24.15Z" />
      <path d="M51.62 44.94A23.5 23.5 0 0 1 33.39 55.46L35.85 42.94L43.07 35.47Z" />
      <path d="M30.61 55.46A23.5 23.5 0 0 1 12.38 44.94L24.45 40.81L34.53 43.32Z" />
      <path d="M10.99 42.52A23.5 23.5 0 0 1 10.99 21.48L20.60 29.87L23.46 39.85Z" />
      <path d="M12.38 19.06A23.5 23.5 0 0 1 30.61 8.54L28.15 21.06L20.93 28.53Z" />
    </svg>
  );
}
