'use client';

/**
 * The cursor is a key light.
 *
 * On a photographer's site the pointer shouldn't be an arrow — it should be the
 * thing she spends her working life positioning. So it renders as a soft ember
 * source: a ring, a hot core, and a wide falloff that lifts whatever it passes
 * over (screen blend on a black page = light, not paint).
 *
 * Any element can retitle it:
 *   <a data-cursor="link">            ring shrinks to a dot
 *   <div data-cursor="view">          ring opens, label reads VIEW
 *   <div data-cursor="play">          ring opens, label reads PLAY
 *   <div data-cursor="drag">          ring opens, label reads DRAG
 *   <div data-cursor-label="OPEN">    override the label text
 *
 * Every frame is written straight to the DOM via refs. Putting pointer position
 * in React state re-renders the tree 120 times a second and the ring visibly
 * lags the pointer — the one thing a custom cursor must never do.
 */

import { useEffect, useRef } from 'react';
import { useFinePointer, useReducedMotion } from '@/lib/hooks';

type CursorMode = 'default' | 'link' | 'view' | 'play' | 'drag';

const MODE_SCALE: Record<CursorMode, number> = {
  default: 1,
  link: 0.42,
  view: 2.6,
  play: 2.9,
  drag: 2.4,
};

export function Cursor() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const enabled = fine && !reduced;

  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!enabled) {
      document.documentElement.removeAttribute('data-cursor');
      return;
    }
    document.documentElement.setAttribute('data-cursor', 'on');

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { x: target.x, y: target.y };
    const glow = { x: target.x, y: target.y };
    let scale = 1;
    let targetScale = 1;
    let opacity = 0;
    let targetOpacity = 0;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      targetOpacity = 1;

      const el = (e.target as Element | null)?.closest<HTMLElement>(
        '[data-cursor], a, button, input, textarea, select, [role="button"]',
      );

      let mode: CursorMode = 'default';
      let label = '';

      if (el) {
        const explicit = el.dataset.cursor as CursorMode | undefined;
        if (explicit && explicit in MODE_SCALE) {
          mode = explicit;
        } else if (
          el.tagName === 'A' ||
          el.tagName === 'BUTTON' ||
          el.getAttribute('role') === 'button'
        ) {
          mode = 'link';
        }
        label = el.dataset.cursorLabel ?? (mode === 'view' || mode === 'play' || mode === 'drag' ? mode.toUpperCase() : '');
      }

      targetScale = MODE_SCALE[mode];
      if (labelRef.current && labelRef.current.textContent !== label) {
        labelRef.current.textContent = label;
        labelRef.current.style.opacity = label ? '1' : '0';
      }
    };

    const onLeave = () => {
      targetOpacity = 0;
    };
    const onEnter = () => {
      targetOpacity = 1;
    };
    const onDown = () => {
      targetScale *= 0.82;
    };
    const onUp = () => {
      targetScale = Math.max(targetScale / 0.82, MODE_SCALE.default);
    };

    const lerp = (a: number, b: number, n: number) => a + (b - a) * n;

    const tick = () => {
      // Two different follow speeds is the whole trick: the ring tracks fast so
      // it feels attached, the glow drags so the light has mass behind it.
      ring.x = lerp(ring.x, target.x, 0.19);
      ring.y = lerp(ring.y, target.y, 0.19);
      glow.x = lerp(glow.x, target.x, 0.085);
      glow.y = lerp(glow.y, target.y, 0.085);
      scale = lerp(scale, targetScale, 0.14);
      opacity = lerp(opacity, targetOpacity, 0.12);

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%) scale(${scale})`;
        ringRef.current.style.opacity = String(opacity);
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%)`;
        dotRef.current.style.opacity = String(opacity * (scale > 1.6 ? 0 : 1));
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${glow.x}px, ${glow.y}px, 0) translate(-50%, -50%) scale(${0.9 + scale * 0.35})`;
        glowRef.current.style.opacity = String(opacity * 0.85);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      document.documentElement.removeAttribute('data-cursor');
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
      {/* wide falloff — the light the key throws */}
      <div
        ref={glowRef}
        className="absolute left-0 top-0 h-[280px] w-[280px] rounded-full opacity-0"
        style={{
          background:
            'radial-gradient(circle, rgba(255,158,94,0.20) 0%, rgba(202,116,59,0.09) 34%, rgba(135,55,3,0.03) 58%, transparent 72%)',
          mixBlendMode: 'screen',
          willChange: 'transform, opacity',
        }}
      />
      {/* the ring — the light source itself */}
      <div
        ref={ringRef}
        className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full opacity-0"
        style={{
          border: '1px solid rgba(255,158,94,0.55)',
          boxShadow: '0 0 18px rgba(233,133,63,0.28), inset 0 0 12px rgba(255,158,94,0.14)',
          willChange: 'transform, opacity',
        }}
      >
        <span
          ref={labelRef}
          className="select-none font-mono text-[3.5px] font-medium uppercase tracking-[0.24em] text-cream opacity-0 transition-opacity duration-200"
        />
      </div>
      {/* hot core */}
      <div
        ref={dotRef}
        className="absolute left-0 top-0 h-[3px] w-[3px] rounded-full bg-glow opacity-0"
        style={{ boxShadow: '0 0 10px rgba(255,158,94,0.9)', willChange: 'transform, opacity' }}
      />
    </div>
  );
}
