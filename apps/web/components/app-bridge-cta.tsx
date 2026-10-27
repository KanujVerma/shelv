'use client';

import React from 'react';

export function AppBridgeCta() {
  return (
    <div className="mineral-card rounded-2xl p-6 sm:p-8 bg-[#FFFEFB] border border-[#345447]/30 shadow-md space-y-5">
      <div className="space-y-2">
        <span className="text-[12px] font-mono uppercase tracking-widest text-[#345447] font-bold">
          The Persistent Advantage
        </span>
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#171A18]">
          This result used only the 3 things you told us.
        </h3>
        <p className="text-[15px] text-[#626760] leading-relaxed max-w-2xl">
          A single web check can only evaluate what you type in the moment. The Shelv iOS app remembers your complete morning and evening routines, products that broke you out months ago, verified ingredients you avoid, and how your barrier adapts over time.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
        <a
          href="https://apps.apple.com"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#345447] hover:bg-[#284237] text-[#FFFEFB] text-[15px] font-medium px-8 py-3.5 rounded-full transition-all shadow-sm active:scale-95 text-center flex items-center justify-center gap-2"
        >
          <span>Let Shelv remember my skin</span>
          <span aria-hidden="true">→</span>
        </a>

        <div className="flex items-center gap-2 text-[12px] text-[#626760] justify-center sm:justify-start">
          <span className="w-1.5 h-1.5 rounded-full bg-[#345447]" />
          <span>Free Scanner · Private On-Device Encryption · No Ad Tracking</span>
        </div>
      </div>
    </div>
  );
}
