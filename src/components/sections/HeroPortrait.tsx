'use client';

/**
 * The portrait plate.
 *
 * Nothing here is a cut-out. Her backdrop already falls off to the page colour
 * — the photograph's corners sample to #060301, which is exactly --color-void —
 * so the plate only needs a feather at the edges to melt into the page.
 */

import Image from 'next/image';
import type { CSSProperties } from 'react';
import { PORTRAIT } from '@/content/site';
import { useCopy } from '@/lib/lang';

/**
 * She has to stand out of the dark, not out of a rectangle. Three masks are
 * intersected: an ellipse centred on her torso, a vertical pass that lifts the
 * top edge above her head and takes out the bottom where the frame crops her
 * shins, and a horizontal pass that kills the side seams.
 *
 * The horizontal pass is not redundant with the ellipse, which is the trap here.
 * The plate renders ~338px wide, so a 68%-wide radial reaches its own edge at
 * 0.735 of its horizontal radius — still ~46% opaque, which draws a visible
 * vertical seam straight down both sides of the photograph against the void.
 * Either shrink the ellipse until it clips her shoulders, or add an explicit
 * horizontal feather. This does the latter, and keeps her shoulders.
 */
const FEATHER_MASK = [
  'radial-gradient(58% 58% at 50% 46%, #000 30%, transparent 97%)',
  'linear-gradient(to bottom, transparent 0%, #000 12%, #000 74%, transparent 100%)',
  'linear-gradient(to right, transparent 0%, #000 15%, #000 85%, transparent 100%)',
].join(', ');

const FEATHER: CSSProperties = {
  maskImage: FEATHER_MASK,
  WebkitMaskImage: FEATHER_MASK,
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
  maskComposite: 'intersect',
  WebkitMaskComposite: 'source-in',
};

export function HeroPortrait() {
  const copy = useCopy();

  return (
    <div className="relative h-full w-full" style={FEATHER}>
      <Image
        src={PORTRAIT.full}
        alt={copy.hero.portraitAlt}
        width={PORTRAIT.width}
        height={PORTRAIT.height}
        priority
        placeholder="blur"
        blurDataURL={PORTRAIT.blur}
        sizes="(max-width: 767px) 78vw, 30vw"
        draggable={false}
        className="absolute inset-0 h-full w-full select-none object-cover object-center"
      />
    </div>
  );
}
