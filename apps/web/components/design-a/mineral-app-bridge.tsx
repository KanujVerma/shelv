'use client';

import React from 'react';

export function MineralAppBridge() {
  return (
    <div className="p-6 sm:p-7 rounded-2xl bg-[#FFFEFB] border border-[#EAE5DC] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
      <div className="space-y-1.5 max-w-xl">
        <h4 className="text-[15px] font-sans font-semibold text-[#171A18]">
          Shelv remembers this in the app.
        </h4>
        <p className="text-[13px] text-[#626760] leading-relaxed">
          A single web check evaluates only what you type right now. The Shelv iOS app remembers your full routine, ingredients you avoid, and tracks how your barrier adapts over time.
        </p>
      </div>

      <a
        href="https://derive-beta-site.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-[#171A18] hover:bg-[#345447] text-[#FFFEFB] text-[13px] font-sans font-medium px-5 py-2.5 rounded-xl transition-all active:scale-[0.98] whitespace-nowrap shrink-0 flex items-center gap-1.5"
      >
        <span>Open in iOS App</span>
        <span aria-hidden="true">→</span>
      </a>
    </div>
  );
}
