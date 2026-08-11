'use client';

/**
 * The closing frame.
 *
 * Everything before this has been evidence; this is the last card of the film,
 * so it gets the biggest type on the page, the most air around it, and an ember
 * horizon burning up from the bottom edge — the light source finally in shot.
 *
 * Every contact channel is null today. Rather than invent an address or leave a
 * dead `mailto:`, the channel markup is written once as data (CHANNEL_LINKS) and
 * driven off CONTACT: the day a real handle lands in site.ts, a working link
 * appears here and the pending line disappears on its own. Until then the page
 * says so quietly and shows the one fact that IS real — where she is based.
 *
 * No form. There is no backend and no address to post to, and a form that goes
 * nowhere is a fake capability dressed as a feature.
 */

import { CONTACT } from '@/content/site';
import { Section, Shell, sectionIndex } from '@/components/ui/Section';
import { MaskLines, Reveal } from '@/components/ui/Reveal';
import { useCopy } from '@/lib/lang';

type ChannelId = 'email' | 'phone' | 'whatsapp' | 'telegram' | 'instagram';

/**
 * How each channel turns a raw handle into a real href. Kept as data so the
 * link-building rules live in one place and can be read at a glance.
 */
const CHANNEL_LINKS: Record<
  ChannelId,
  { href: (value: string) => string; label: (value: string) => string; external: boolean }
> = {
  email: { href: (v) => `mailto:${v}`, label: (v) => v, external: false },
  // Dial strings must lose spaces and dashes; the visible label keeps them.
  phone: { href: (v) => `tel:${v.replace(/[^+\d]/g, '')}`, label: (v) => v, external: false },
  whatsapp: { href: (v) => `https://wa.me/${v.replace(/\D/g, '')}`, label: (v) => v, external: true },
  telegram: {
    href: (v) => `https://t.me/${v.replace(/^@/, '')}`,
    label: (v) => (v.startsWith('@') ? v : `@${v}`),
    external: true,
  },
  instagram: {
    href: (v) => `https://instagram.com/${v.replace(/^@/, '')}`,
    label: (v) => (v.startsWith('@') ? v : `@${v}`),
    external: true,
  },
};

/** Reading order of the channels, once they exist. */
const CHANNEL_ORDER: ChannelId[] = ['email', 'phone', 'whatsapp', 'telegram', 'instagram'];

/**
 * Same rule as every other heading on the site: the line break is editorial, so
 * split at the clause comma where a language has one and balance the words where
 * it does not.
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

export function Contact() {
  const copy = useCopy();

  const channels = CHANNEL_ORDER.map((id) => ({ id, value: CONTACT[id] })).filter(
    (channel): channel is { id: ChannelId; value: string } =>
      typeof channel.value === 'string' && channel.value.trim().length > 0,
  );

  return (
    <Section
      id="contact"
      pad="none"
      className="overflow-hidden pt-[clamp(6rem,15vh,12rem)] pb-[clamp(7rem,18vh,14rem)]"
    >
      {/* The horizon. Sits under the content, never over it. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[70%]"
        style={{
          background:
            'radial-gradient(72% 100% at 50% 118%, rgba(168,72,10,0.30), rgba(135,55,3,0.11) 44%, transparent 72%)',
        }}
      />

      <Shell className="relative z-10">
        <header className="flex flex-col items-start text-left">
          <Reveal className="mb-[clamp(1.25rem,2.4vh,2rem)]" y={16}>
            <span className="t-meta inline-flex items-center gap-3">
              <span className="text-ember-hot">{sectionIndex('contact')}</span>
              <span
                aria-hidden
                className="inline-block h-px w-8 bg-linear-to-r from-ember-hot/70 to-transparent"
              />
              {copy.contact.eyebrow}
            </span>
          </Reveal>

          <MaskLines
            lines={splitHeading(copy.contact.heading)}
            className="t-display text-[clamp(2.75rem,9.5vw,8rem)] text-cream"
          />

          <Reveal delay={0.12} y={20}>
            <p className="t-lead mt-[clamp(1.5rem,3vh,2.5rem)] max-w-[38ch]">{copy.contact.body}</p>
          </Reveal>
        </header>

        <Reveal y={18} className="mt-[clamp(2.75rem,6vh,4.5rem)]">
          <div className="hairline" />
        </Reveal>

        <div className="mt-[clamp(2rem,4.5vh,3.25rem)] flex flex-col gap-[clamp(2rem,4.5vh,3rem)] md:flex-row md:items-start md:justify-between md:gap-[clamp(2.5rem,6vw,6rem)]">
          <Reveal y={22} className="min-w-0 md:flex-1">
            {channels.length > 0 ? (
              <ul className="grid grid-cols-1 gap-x-[clamp(1.5rem,4vw,3rem)] gap-y-[clamp(1.25rem,2.6vh,1.75rem)] sm:grid-cols-2">
                {channels.map(({ id, value }) => {
                  const link = CHANNEL_LINKS[id];
                  return (
                    <li key={id} className="min-w-0">
                      <a
                        href={link.href(value)}
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noreferrer noopener' : undefined}
                        data-cursor="link"
                        className="group flex min-h-11 min-w-0 flex-col justify-center gap-1.5 py-1"
                      >
                        <span className="font-mono text-[0.63rem] uppercase tracking-[0.22em] text-smoke transition-colors duration-300 group-hover:text-flame">
                          {copy.contact.channels[id]}
                        </span>
                        <span className="relative inline-block w-fit max-w-full">
                          <span className="truncate-1 font-sans text-[clamp(1.05rem,1.9vw,1.4rem)] leading-snug text-cream transition-colors duration-300 group-hover:text-glow">
                            {link.label(value)}
                          </span>
                          {/* Ember sweep. Reduced motion flattens the duration globally. */}
                          <span
                            aria-hidden
                            className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-linear-to-r from-flare via-ember-hot to-transparent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
                          />
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="t-meta max-w-[34ch] leading-[2]">{copy.contact.pending}</p>
            )}
          </Reveal>

          <Reveal y={22} delay={0.08} className="min-w-0 md:shrink-0 md:text-right">
            <div className="flex flex-col gap-2">
              <span className="t-meta">{copy.contact.basedIn}</span>
              <span className="font-sans text-[clamp(1.05rem,1.9vw,1.4rem)] leading-snug text-bone">
                {CONTACT.location}
              </span>
            </div>
          </Reveal>
        </div>
      </Shell>
    </Section>
  );
}
