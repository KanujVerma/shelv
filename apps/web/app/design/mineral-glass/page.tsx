import React from 'react';
import { MineralTopBar } from '@/components/design-a/top-bar';
import { MineralHero } from '@/components/design-a/mineral-hero';
import { MineralFooter } from '@/components/design-a/mineral-footer';

export const metadata = {
  title: 'Direction A: Mineral Glass | Shelv Design Lab',
  description: 'The closest web expression of the Shelv native app.',
};

export default function MineralGlassPage() {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F6F3EC] text-[#171A18] font-sans antialiased selection:bg-[#E2EAE4] selection:text-[#345447]">
      <MineralTopBar />
      <main>
        <MineralHero />
      </main>
      <MineralFooter />
    </div>
  );
}
