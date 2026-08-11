'use client';

/**
 * The portrait plate — and the one idea the whole site is built on.
 *
 * photoRelight derives a surface normal from the photograph itself, so the
 * specular it adds wraps her actual jaw, shoulder and hair rather than sliding a
 * gradient across a rectangle. Wiring that light to the pointer means the
 * visitor is holding the key light of a photographer's own portrait. She spends
 * her working life deciding where the lamp goes; here she hands it over.
 *
 * Nothing here is a cut-out. Her backdrop already falls off to the page colour,
 * so the plate only needs a feather at the edges.
 */

import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { PORTRAIT } from '@/content/site';
import { useWebGLAllowed } from '@/lib/hooks';
import { useCopy } from '@/lib/lang';

/** The slice of photoRelight's API this component actually depends on. */
type Relight = {
  setLight(x: number, y: number): void;
  destroy(): void;
};

/**
 * The shader is fed the 560px plate, not the full one. Its sobel window is a
 * fixed number of texels wide, so a smaller source is a WIDER window in image
 * terms — which is the documented cure for normals that pick up compression
 * noise instead of form (photoRelight.README, gotcha 3). The rendered plate is
 * ~270–420 CSS px wide, so this costs nothing visible and removes the crumpled
 * foil from her hair.
 */
const TEXTURE = PORTRAIT.small;

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

/**
 * Pointer position → light position, in the canvas's own uv space.
 *
 * Exact while the pointer is over the plate, then compressed once it leaves, so
 * a cursor on the far side of the page still says "the light is over there"
 * instead of pinning to the edge and going dead. Continuous at the boundary.
 */
function toLightUv(v: number): number {
  if (v >= 0 && v <= 1) return v;
  const over = v > 1 ? v - 1 : -v;
  const spill = 0.55 * (1 - Math.exp(-over * 0.85));
  return v > 1 ? 1 + spill : -spill;
}

export function HeroPortrait() {
  const copy = useCopy();
  const allowed = useWebGLAllowed();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lit, setLit] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!allowed || !canvas) return;

    let fx: Relight | null = null;
    let cancelled = false;
    // null means "needs measuring". Kept out of the pointer handler so a fast
    // mouse doesn't force a layout read per event.
    let rect: DOMRect | null = null;

    const invalidate = () => {
      rect = null;
    };

    const onMove = (e: PointerEvent) => {
      if (!fx) return;
      if (!rect) rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      fx.setLight(
        toLightUv((e.clientX - rect.left) / rect.width),
        // uv origin is bottom-left in the shader; clientY grows downward.
        toLightUv(1 - (e.clientY - rect.top) / rect.height),
      );
    };

    // The entrance tween scales and shifts the plate for ~2s without firing
    // scroll or resize, so re-measure once it has settled.
    const settle = window.setTimeout(invalidate, 2400);

    const boot = async () => {
      // Wait for the plate to be in cache before creating the effect:
      // photoRelight uploads its texture on img.onload and draws a 1×1
      // placeholder until then, so revealing the canvas any earlier would put a
      // black rectangle over the fallback <Image>.
      //
      // load, not decode(): decode() never settles while the document is
      // hidden, which would leave a backgrounded tab permanently unlit.
      const loaded = await new Promise<boolean>((resolve) => {
        const probe = new window.Image();
        probe.onload = () => resolve(true);
        probe.onerror = () => resolve(false);
        probe.src = TEXTURE;
        if (probe.complete) resolve(true);
      });
      // A plate that never arrived is a plate we must not paint over.
      if (!loaded || cancelled) return;

      // Loaded on demand so the shader source never reaches devices that are
      // gated out of it.
      let mod: typeof import('@/lib/webgl/photoRelight');
      try {
        mod = await import('@/lib/webgl/photoRelight');
      } catch {
        return;
      }
      if (cancelled) return;

      try {
        fx = new mod.PhotoRelight(canvas, [TEXTURE], {
          // Her rim light is sodium-warm already; a cold key would fight the
          // photograph instead of extending it.
          warm: [0.75],
          // Low on purpose. The shader was written for car paint against a dark
          // ground; her ground is a lit backdrop, so it passes the gloss gate
          // too and any strength above ~0.35 turns her hair into crumpled foil
          // and the backdrop's compression banding into visible streaks.
          intensity: [0.3],
          // She is a person, not a car — a hint of depth, not a diorama.
          parallax: 0.022,
        });
      } catch {
        return; // WebGL2 can still fail on a context-starved tab
      }

      // Registered AFTER the constructor on purpose. photoRelight installs its
      // own window pointermove that maps to the VIEWPORT, which is the wrong
      // frame for a plate occupying a quarter of the screen. Both handlers run
      // on the same event and the last one registered wins, so ours — measured
      // against the canvas rect the shader actually samples — is the one that
      // lands.
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('scroll', invalidate, { passive: true });
      window.addEventListener('resize', invalidate);

      // Key her from just above head height until the pointer arrives.
      fx.setLight(0.5, 0.76);
      setLit(true);
    };

    void boot();

    return () => {
      cancelled = true;
      window.clearTimeout(settle);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', invalidate);
      window.removeEventListener('resize', invalidate);
      fx?.destroy();
      fx = null;
      setLit(false);
    };
  }, [allowed]);

  return (
    <div className="relative h-full w-full" style={FEATHER}>
      {/* Always present: the load fallback, and the whole plate when the device
          is gated out of WebGL. Same source, same box, same crop — so the canvas
          fading in over it reads as the light coming up, not as a swap. */}
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

      {allowed ? (
        <canvas
          ref={canvasRef}
          aria-hidden
          className="absolute inset-0 block h-full w-full transition-opacity duration-700 ease-out"
          style={{ opacity: lit ? 1 : 0 }}
        />
      ) : null}
    </div>
  );
}
