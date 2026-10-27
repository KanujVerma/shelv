'use client';

import React from 'react';

const PRINCIPLES = [
  {
    title: 'We show what we know.',
    body: 'If a formula concentration, exact pH, or packaging variant is unverified, Shelv explicitly marks it unknown. We never simulate certainty with generative filler.',
  },
  {
    title: 'Your context changes the answer.',
    body: 'There is no universally superior skincare bottle. An active that clears one person’s acne will compromise another person’s moisture barrier if stacked onto a retinoid.',
  },
  {
    title: 'Recommendations aren’t bought.',
    body: 'Shelv accepts zero affiliate commissions, sponsored placements, or advertising from skincare brands. Commercial deals never dictate product evaluations.',
  },
];

export function TrustSection() {
  return (
    <section id="trust" className="py-20 px-4 sm:px-8 max-w-5xl mx-auto border-t border-[#EAE5DC]">
      <div className="text-center space-y-3 mb-12">
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#171A18] tracking-tight">
          Skincare requires absolute trust.
        </h2>
        <p className="text-[16px] text-[#626760] max-w-2xl mx-auto leading-relaxed">
          The skincare industry is crowded with hype, bought rankings, and arbitrary ratings. Shelv operates on rigorous evidence boundaries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PRINCIPLES.map((item, i) => (
          <div
            key={i}
            className="mineral-card rounded-2xl p-6 sm:p-7 space-y-3 bg-[#FFFEFB] border border-[#EAE5DC]"
          >
            <div className="w-8 h-8 rounded-full bg-[#E2EAE4] text-[#345447] flex items-center justify-center font-mono font-bold text-[13px]">
              0{i + 1}
            </div>
            <h3 className="text-lg font-serif font-bold text-[#171A18]">
              {item.title}
            </h3>
            <p className="text-[14px] text-[#626760] leading-relaxed">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
