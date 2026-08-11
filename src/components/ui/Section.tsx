'use client';

import { forwardRef, type ReactNode } from 'react';
import { SITE, type SectionId } from '@/content/site';

/**
 * Every section is numbered like a shot list. The number is not decoration —
 * it's the same index the nav rail uses, so what the rail says and what the
 * page says can never drift apart.
 */
export function sectionIndex(id: SectionId): string {
  const i = SITE.sections.indexOf(id);
  return String(Math.max(i, 0)).padStart(2, '0');
}

type SectionProps = {
  id: SectionId;
  children: ReactNode;
  className?: string;
  /** Vertical rhythm. 'none' when the section manages its own (hero, pinned work). */
  pad?: 'none' | 'normal' | 'tight';
};

export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { id, children, className = '', pad = 'normal' },
  ref,
) {
  const padding =
    pad === 'none'
      ? ''
      : pad === 'tight'
        ? 'py-[clamp(4.5rem,9vh,7rem)]'
        : 'py-[clamp(6rem,15vh,12rem)]';

  return (
    <section
      ref={ref}
      id={id}
      data-section={id}
      className={`relative w-full ${padding} ${className}`}
    >
      {children}
    </section>
  );
});

/** Standard horizontal shell. Keeps every section on the same left edge. */
export function Shell({
  children,
  className = '',
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`mx-auto w-full ${wide ? 'max-w-[110rem]' : 'max-w-[82rem]'} px-[var(--shell-x)] ${className}`}
    >
      {children}
    </div>
  );
}
