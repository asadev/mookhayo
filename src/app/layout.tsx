import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Inter_Tight, JetBrains_Mono } from 'next/font/google';
import { COPY, DEFAULT_LANG, SITE } from '@/content/site';
import { Providers } from '@/components/Providers';
import './globals.css';

/**
 * Three voices, on purpose:
 *   display — Instrument Serif. High contrast, editorial, holds a huge size without
 *             turning into a slab. The drama.
 *   sans    — Inter Tight. Reads at length, tight enough not to feel corporate.
 *   mono    — JetBrains Mono. Every label, section number and timecode. It's the
 *             camera-slate voice, and it's what makes the page feel like a crew made it.
 */
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-instrument-serif',
});

const interTight = Inter_Tight({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter-tight',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

const copy = COPY[DEFAULT_LANG];

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: copy.meta.title,
  description: copy.meta.description,
  applicationName: SITE.mark,
  authors: [{ name: copy.hero.name }],
  keywords: [
    'videographer',
    'mobileographer',
    'video editor',
    'content creator',
    'real estate video',
    'Dubai',
    'Tashkent',
    'Uzbekistan',
  ],
  openGraph: {
    type: 'website',
    url: SITE.url,
    title: copy.meta.title,
    description: copy.meta.description,
    siteName: SITE.mark,
  },
  twitter: {
    card: 'summary_large_image',
    title: copy.meta.title,
    description: copy.meta.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#060301',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The font variable classes MUST sit on <html>, not <body>. Tailwind v4's
    // @theme emits `--font-display: var(--font-instrument-serif), …` on :root
    // (= <html>); if the font variables are declared one level lower, that
    // var() is undefined at :root, --font-display resolves to the
    // guaranteed-invalid value, and every .t-heading/.t-display/.t-meta on the
    // site silently falls back to the system sans stack.
    <html
      lang={DEFAULT_LANG}
      suppressHydrationWarning
      className={`${instrumentSerif.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-void text-cream antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
