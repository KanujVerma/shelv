import React from 'react';
import { EditorialNav } from '@/components/design-b/editorial-nav';
import { EditorialHero } from '@/components/design-b/editorial-hero';
import { EditorialFooter } from '@/components/design-b/editorial-footer';

export const metadata = {
  title: 'Direction B: Editorial Intelligence | Shelv Design Lab',
  description: 'More expressive premium brand experience while remaining product-first.',
};

export default function EditorialPage() {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F6F3EC] text-[#171A18] antialiased selection:bg-[#EAE5DC] selection:text-[#171A18]">
      <EditorialNav />
      <main>
        <EditorialHero />
      </main>
      <EditorialFooter />
    </div>
  );
}
