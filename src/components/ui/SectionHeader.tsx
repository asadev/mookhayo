'use client';

import type { SectionId } from '@/content/site';
import { sectionIndex } from './Section';
import { MaskLines, Reveal } from './Reveal';

/**
 * One header shape for every section — eyebrow with its shot number, a display
 * heading that rises out of a mask, and an optional lead paragraph.
 *
 * Headings are passed as an array of lines rather than one string, so the
 * line breaks are an editorial decision rather than whatever the viewport
 * happens to do. Callers keep the copy in site.ts and split it here.
 */
export function SectionHeader({
  id,
  eyebrow,
  headingLines,
  body,
  align = 'left',
  className = '',
}: {
  id: SectionId;
  eyebrow: string;
  headingLines: string[];
  body?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  const alignment = align === 'center' ? 'items-center text-center' : 'items-start text-left';

  return (
    <header className={`flex flex-col ${alignment} ${className}`}>
      <Reveal className="mb-[clamp(1.25rem,2.4vh,2rem)]" y={16}>
        <span className="t-meta inline-flex items-center gap-3">
          <span className="text-ember-hot">{sectionIndex(id)}</span>
          <span className="inline-block h-px w-8 bg-linear-to-r from-ember-hot/70 to-transparent" />
          {eyebrow}
        </span>
      </Reveal>

      <MaskLines
        lines={headingLines}
        className="t-heading text-[clamp(2.25rem,6.2vw,5.25rem)] text-cream"
      />

      {body ? (
        <Reveal delay={0.12} y={20} className={align === 'center' ? 'mx-auto' : ''}>
          <p className="t-body mt-[clamp(1.25rem,2.6vh,2rem)] max-w-[46ch]">{body}</p>
        </Reveal>
      ) : null}
    </header>
  );
}
