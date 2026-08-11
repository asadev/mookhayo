import { Header } from '@/components/chrome/Header';
import { NavRail } from '@/components/chrome/NavRail';
import { ScrollProgress } from '@/components/chrome/ScrollProgress';
import { Hero } from '@/components/sections/Hero';
import { Intro } from '@/components/sections/Intro';
import { Reel } from '@/components/sections/Reel';
import { Work } from '@/components/sections/Work';
import { Disciplines } from '@/components/sections/Disciplines';
import { Journey } from '@/components/sections/Journey';
import { Certificates } from '@/components/sections/Certificates';
import { Contact } from '@/components/sections/Contact';
import { Footer } from '@/components/sections/Footer';

/**
 * Section order is the film's edit, and it is asserted in SITE.sections so the
 * nav rail's numbering can never disagree with the page.
 *
 * hero      — who, at full volume
 * intro     — what she actually believes about the work
 * reel      — the fastest possible proof
 * work      — the evidence
 * disciplines — the range, once they care
 * journey   — how she got here (the credibility)
 * certificates — the paperwork that backs the journey
 * contact   — the close
 */
export default function Home() {
  return (
    <>
      <ScrollProgress />
      <Header />
      <NavRail />

      <main id="main">
        <Hero />
        <Intro />
        <Reel />
        <Work />
        <Disciplines />
        <Journey />
        <Certificates />
        <Contact />
      </main>

      <Footer />
    </>
  );
}
