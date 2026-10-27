import React from 'react';
import { SynthesisNav } from '@/components/synthesis/synthesis-nav';
import { SynthesisHero } from '@/components/synthesis/synthesis-hero';
import { SynthesisFooter } from '@/components/synthesis/synthesis-footer';

export const metadata = {
  title: 'Shelv — Personalized Skincare Product Intelligence',
  description: 'Know before you buy. Paste a skincare link. Get an honest answer.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F6F3EC] text-[#171A18] font-sans antialiased selection:bg-[#E2EAE4] selection:text-[#345447] flex flex-col justify-between">
      <SynthesisNav />
      <main className="flex-1">
        <SynthesisHero />
      </main>
      <SynthesisFooter />
    </div>
  );
}
