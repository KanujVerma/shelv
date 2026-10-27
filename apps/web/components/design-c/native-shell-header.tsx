'use client';

import React from 'react';
import Link from 'next/link';

export function NativeShellHeader() {
  return (
    <header className="w-full h-14 border-b border-[#EAE5DC] bg-[#FFFEFB]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Link
          href="/design/native"
          className="font-sans font-bold text-sm tracking-wider text-[#171A18]"
        >
          <img src="/brand/shelv-transparent.svg" width="32" height="32" alt="" aria-hidden="true" className="inline-block shrink-0 align-middle" /> SHELV
        </Link>
        <span className="text-[11px] font-sans px-2 py-0.5 rounded-full bg-[#E2EAE4] text-[#345447] font-semibold">
          Check
        </span>
      </div>

      <div className="flex items-center gap-3 text-[12px] font-sans">
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
          className="bg-[#171A18] hover:bg-[#345447] text-[#FFFEFB] px-3 py-1 rounded-full font-medium transition-all"
        >
          Get App
        </a>
      </div>
    </header>
  );
}
