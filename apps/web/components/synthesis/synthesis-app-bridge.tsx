'use client';

import React from 'react';

export function SynthesisAppBridge() {
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#FFFEFB] border border-[#EAE5DC] shadow-sm font-sans space-y-3 transition-all hover:border-[#345447]/20">
      <div className="flex items-center justify-between">
        <h4 className="text-[14px] sm:text-[15px] font-semibold text-[#171A18] tracking-tight">
          Shelv remembers this in the app
        </h4>
        <span className="text-[10px] font-bold bg-[#E2EAE4] text-[#345447] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          iOS App
        </span>
      </div>

      <p className="text-[13px] text-[#626760] leading-relaxed">
        A single web check evaluates what you paste today. The iOS app saves this formula to your shelf, warns against clashes with your existing actives, and lets you scan barcodes in stores.
      </p>

      <div className="pt-1">
        <a
          href="https://derive-beta-site.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#171A18] hover:bg-[#345447] text-[#FFFEFB] text-[13px] font-medium px-5 py-2.5 rounded-xl transition-all active:scale-[0.98] shadow-2xs"
        >
          <span>Get Shelv for iPhone</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}
