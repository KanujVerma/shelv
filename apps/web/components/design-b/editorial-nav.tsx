'use client';

import React from 'react';
import Link from 'next/link';

export function EditorialNav() {
  return (
    <header className="w-full border-b border-[#EAE5DC] bg-[#F6F3EC]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <Link
            href="/design/editorial"
            className="font-serif font-bold text-xl tracking-tight text-[#171A18] hover:opacity-85 transition-opacity"
          >
            <img src="/brand/shelv-transparent.svg" width="32" height="32" alt="" aria-hidden="true" className="inline-block shrink-0 align-middle" /> SHELV
          </Link>
          <span className="text-[12px] font-sans text-[#626760] hidden sm:inline">
            Cosmetic Product Intelligence
          </span>
        </div>

        <div className="flex items-center gap-4 text-[13px] font-sans">
          <Link
            href="/design"
            className="text-[#626760] hover:text-[#171A18] transition-colors"
          >
            Design Lab
          </Link>
          <a
            href="https://derive-beta-site.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#171A18] hover:text-[#345447] underline underline-offset-4 transition-colors"
          >
            iOS App ↗
          </a>
        </div>
      </div>
    </header>
  );
}
