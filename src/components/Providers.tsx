'use client';

import type { ReactNode } from 'react';
import { LangProvider } from '@/lib/lang';
import { SmoothScrollProvider } from '@/lib/smooth-scroll';
import { Cursor } from '@/components/chrome/Cursor';

/**
 * Order matters: language is outermost (chrome reads copy), smooth scroll next
 * (sections register ScrollTriggers inside it), atmosphere last so it paints
 * over everything.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <LangProvider>
      <SmoothScrollProvider>
        {children}
        <div className="grain" aria-hidden />
        <div className="vignette" aria-hidden />
        <Cursor />
      </SmoothScrollProvider>
    </LangProvider>
  );
}
