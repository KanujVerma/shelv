import React from 'react';
import { NativeShellHeader } from '@/components/design-c/native-shell-header';
import { NativeUtilityHero } from '@/components/design-c/native-utility-hero';
import { NativeFooter } from '@/components/design-c/native-footer';

export const metadata = {
  title: 'Direction C: Native Utility | Shelv Design Lab',
  description: 'Almost eliminate the traditional landing page. Opening the page feels like opening Shelv itself.',
};

export default function NativeUtilityPage() {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F6F3EC] text-[#171A18] font-sans antialiased selection:bg-[#E2EAE4] selection:text-[#345447]">
      <NativeShellHeader />
      <main>
        <NativeUtilityHero />
      </main>
      <NativeFooter />
    </div>
  );
}
