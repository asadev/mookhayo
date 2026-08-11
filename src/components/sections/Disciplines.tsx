'use client';

/**
 * DISCIPLINES — an index, not a card grid.
 *
 * Six boxes in a grid is what every template does, and it flattens six real
 * skills into six equal tiles. A hairline-separated index reads like the
 * contents page of a book instead: numbered, ranked, scannable in one pass,
 * and it lets each title be set at a size a card could never afford.
 *
 * Disclosure model — three states, one source of truth (`data-state`):
 *   auto   — nobody has touched this row. CSS decides: open on phones (where
 *            there is no hover and the text has to be readable), closed at md+
 *            where hovering the row previews it.
 *   open   — the visitor expanded it. Beats every default.
 *   closed — the visitor collapsed it. Also beats every default, including the
 *            hover preview, so clicking a row you are pointing at is never a
 *            no-op. That is why the hover rule is scoped to `state=auto`
 *            rather than left to fight the closed rule on source order.
 *
 * The panel is in the DOM at every state — collapsed only by grid-template-rows
 * — so the copy is present for search and for assistive tech even when the row
 * reads as closed. `aria-expanded` describes the visual state, which is exactly
 * what it is for.
 */

import { useState } from 'react';
import { DISCIPLINES } from '@/content/site';
import { useIsMobile } from '@/lib/hooks';
import { useCopy } from '@/lib/lang';
import { RevealGroup } from '@/components/ui/Reveal';
import { Section, Shell } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';

type PanelState = 'auto' | 'open' | 'closed';

/**
 * The ember wash. Bleeds one shell gutter to the left so the light appears to
 * come from off-frame rather than from inside the text column — and stops
 * there, so it can never push the page sideways.
 */
const GLOW =
  'pointer-events-none absolute inset-y-0 right-0 left-[calc(var(--shell-x)*-1)] ' +
  'bg-linear-to-r from-ember-hot/20 via-ember/8 to-transparent ' +
  'opacity-0 -translate-x-3 transition duration-[650ms] ease-[var(--ease-out-expo)] ' +
  'md:group-hover:opacity-100 md:group-hover:translate-x-0';

/** 0fr → 1fr animates height without measuring anything in JS. */
const PANEL =
  'grid transition-[grid-template-rows] duration-[520ms] ease-[var(--ease-out-expo)] ' +
  'grid-rows-[1fr] md:grid-rows-[0fr] ' +
  'md:group-hover:data-[state=auto]:grid-rows-[1fr] ' +
  'data-[state=open]:grid-rows-[1fr] data-[state=closed]:grid-rows-[0fr]';

/** The upright of the plus sign — present when closed, gone when open. */
const PLUS_BAR =
  'absolute h-full w-px bg-bone/45 transition duration-500 md:group-hover:bg-flare ' +
  'opacity-0 md:opacity-100 ' +
  'md:group-hover:data-[state=auto]:opacity-0 ' +
  'data-[state=open]:opacity-0 data-[state=closed]:opacity-100';

/**
 * Break the heading at its comma.
 *
 * All three translations are built the same way — a count, a comma, then the
 * turn ("one pair of hands") — so the comma puts the break in the same
 * rhetorical place in every language, which a hand-picked word index would not.
 */
function toLines(heading: string): string[] {
  const at = heading.indexOf(',');
  if (at < 0) return [heading];
  return [heading.slice(0, at + 1), heading.slice(at + 1).trim()];
}

export function Disciplines() {
  const copy = useCopy();
  const mobile = useIsMobile();
  // Only rows the visitor has actually touched appear here; everything else
  // stays 'auto' so CSS keeps owning the per-viewport default.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const toggle = (id: string) =>
    setOverrides((prev) => ({ ...prev, [id]: !(prev[id] ?? mobile) }));

  const last = DISCIPLINES.length - 1;

  return (
    <Section id="disciplines">
      <Shell>
        <SectionHeader
          id="disciplines"
          eyebrow={copy.disciplines.eyebrow}
          headingLines={toLines(copy.disciplines.heading)}
          body={copy.disciplines.body}
        />

        <RevealGroup
          as="ol"
          selector=":scope > li"
          y={22}
          stagger={0.06}
          className="mt-[clamp(3rem,7vh,5rem)] list-none"
        >
          {DISCIPLINES.map((discipline, i) => {
            const item = copy.disciplines.items[discipline.id];
            // A structural id with no copy would render a numbered blank line.
            if (!item) return null;

            const expanded = overrides[discipline.id] ?? mobile;
            const state: PanelState =
              overrides[discipline.id] === undefined
                ? 'auto'
                : overrides[discipline.id]
                  ? 'open'
                  : 'closed';
            const panelId = `discipline-${discipline.id}`;

            return (
              <li key={discipline.id} className="group relative">
                <div className="hairline" aria-hidden />

                {/* first in the DOM so it paints under the row without needing
                    a negative z-index, which on a transparent page would put it
                    behind the document background entirely */}
                <span aria-hidden className={GLOW} />

                <div className="relative transition-transform duration-500 ease-[var(--ease-out-expo)] md:group-hover:-translate-y-[3px]">
                  <button
                    type="button"
                    data-cursor="link"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={() => toggle(discipline.id)}
                    className="flex w-full items-baseline py-[clamp(1.25rem,2.8vh,2rem)] text-left"
                  >
                    {/* the colour lives on a child: .t-meta is unlayered CSS and
                        would otherwise outrank any utility on the same element */}
                    <span className="t-meta w-[2.75rem] shrink-0 md:w-[5rem]">
                      <span className="text-ember-hot/75 transition-colors duration-500 md:group-hover:text-flare">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </span>

                    <span className="t-heading min-w-0 flex-1 text-[clamp(1.375rem,3.2vw,2.5rem)] text-cream transition-colors duration-500 md:group-hover:text-flare">
                      {item.title}
                    </span>

                    <span
                      aria-hidden
                      className="relative ml-4 flex h-3.5 w-3.5 shrink-0 items-center justify-center self-center"
                    >
                      <span className="absolute h-px w-full bg-bone/45 transition duration-500 md:group-hover:bg-flare" />
                      <span data-state={state} className={PLUS_BAR} />
                    </span>
                  </button>

                  <div id={panelId} data-state={state} className={PANEL}>
                    <div className="overflow-hidden">
                      <p className="t-body max-w-[58ch] pb-[clamp(1.25rem,2.8vh,2rem)] pl-[2.75rem] md:pl-[5rem]">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </div>

                {i === last ? <div className="hairline" aria-hidden /> : null}
              </li>
            );
          })}
        </RevealGroup>
      </Shell>
    </Section>
  );
}
