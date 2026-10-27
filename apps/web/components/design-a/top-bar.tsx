'use client';

import React from 'react';
import Link from 'next/link';

export function MineralTopBar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 px-4 sm:px-8 pt-4 pointer-events-none">
      <div className="max-w-4xl mx-auto flex items-center justify-between pointer-events-auto">
        {/* Brand Mark Pill */}
        <Link
          href="/design/mineral-glass"
          className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#FFFEFB]/80 backdrop-blur-md border border-[#EAE5DC] shadow-2xs hover:bg-[#FFFEFB] transition-all"
        >
          <span className="font-serif font-bold text-[15px] tracking-wider text-[#171A18]">
            <img src="/brand/shelv-transparent.svg" width="32" height="32" alt="" aria-hidden="true" className="inline-block shrink-0 align-middle" /> SHELV
          </span>
          <span className="w-1 h-1 rounded-full bg-[#345447]" />
          <span className="text-[12px] font-sans font-medium text-[#626760]">
            Check
          </span>
        </Link>

        {/* Minimal Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/design"
            className="hidden sm:inline-flex text-[12px] font-sans font-medium text-[#626760] hover:text-[#171A18] px-3 py-1.5 rounded-full bg-[#FFFEFB]/60 backdrop-blur-md border border-[#EAE5DC] transition-all"
          >
            Design Lab
          </Link>
          <a
            href="https://derive-beta-site.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] font-sans font-medium bg-[#345447] text-[#FFFEFB] px-3.5 py-1.5 rounded-full shadow-2xs hover:bg-[#284237] transition-all"
          >
            Get App
          </a>
        </div>
      </div>
    </header>
  );
}
