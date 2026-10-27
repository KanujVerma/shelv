'use client';

import React from 'react';

export function EditorialNarrative() {
  return (
    <div className="border-t border-[#EAE5DC] pt-12 space-y-8">
      <div className="max-w-2xl space-y-3">
        <span className="text-[11px] font-sans font-semibold uppercase tracking-widest text-[#626760]">
          The Persistent Advantage
        </span>
        <h3 className="text-2xl sm:text-3xl font-serif font-normal text-[#171A18] tracking-tight">
          Why web checks have limits.
        </h3>
        <p className="text-[15px] font-sans text-[#626760] leading-relaxed">
          A single link only provides the formula on the packaging. The Shelv iOS app preserves your complete morning and evening regimen, products that compromised your barrier months ago, and your adapting skin tolerance.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <a
          href="https://derive-beta-site.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#171A18] hover:bg-[#345447] text-[#FFFEFB] text-[13px] font-sans font-medium px-6 py-3 rounded-lg transition-all"
        >
          Download Shelv on iOS →
        </a>
        <span className="text-[12px] font-sans text-[#626760]">
          Private on-device encryption · No ad tracking · Scanner-first
        </span>
      </div>
    </div>
  );
}
