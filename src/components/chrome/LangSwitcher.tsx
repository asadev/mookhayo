'use client';

/**
 * Three languages, one segmented control.
 *
 * Language is client state (see lib/lang), so switching is a re-render and
 * nothing else — no navigation, no scroll reset, no torn-down canvas. That is
 * the whole reason this is a set of buttons rather than three links.
 *
 * Buttons, not a <select>: three options is below the threshold where a
 * dropdown earns its extra interaction, and the current language should be
 * readable without opening anything.
 */

import { LANGS, LANG_LABELS } from '@/content/site';
import { useLang } from '@/lib/lang';

export function LangSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang, copy } = useLang();

  return (
    <div
      role="group"
      aria-label={copy.a11y.langSwitcher}
      className={`glass-chrome inline-flex items-center gap-0.5 rounded-full p-[3px] ${className}`}
    >
      {LANGS.map((code) => {
        const isActive = code === lang;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={isActive}
            data-cursor="link"
            // Fixed width, not min-width: globals.css sets `* { min-width: 0 }`
            // outside any @layer, and unlayered rules beat every utility layer.
            className={`flex h-10 w-[2.6rem] items-center justify-center rounded-full font-mono text-[0.65rem] tracking-[0.12em] transition-colors duration-300 ease-out-expo sm:h-8 sm:w-9 ${
              isActive
                ? 'bg-ember text-cream shadow-[0_0_20px_-6px_rgba(168,72,10,0.95)]'
                : 'text-smoke hover:text-cream'
            }`}
          >
            {LANG_LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
