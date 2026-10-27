'use client';

import React from 'react';

export function DifferentiationSection() {
  return (
    <section id="differentiation" className="py-20 px-4 sm:px-8 max-w-5xl mx-auto border-t border-[#EAE5DC]">
      <div className="text-center space-y-3 mb-12">
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#171A18] tracking-tight">
          Not a score. A decision.
        </h2>
        <p className="text-[16px] text-[#626760] max-w-2xl mx-auto leading-relaxed">
          Skincare apps give products an arbitrary 0–100 number. But no number knows what is already on your counter, whether your barrier is compromised, or if you applied a retinoid last night.
        </p>
      </div>

      {/* Visual Contrast Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Left: The Generic Scanner */}
        <div className="mineral-card rounded-2xl p-6 sm:p-8 space-y-5 bg-[#FFFEFB]/60 border border-[#EAE5DC] opacity-85">
          <div className="flex items-center justify-between pb-4 border-b border-[#EAE5DC]">
            <span className="text-[12px] font-mono uppercase tracking-widest text-[#626760]">
              Generic Scanner
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F6F3EC] text-[#626760]">
              Blind to your routine
            </span>
          </div>

          <div className="text-center py-4 space-y-2">
            <div className="text-5xl font-mono font-bold text-[#626760]">
              82 <span className="text-xl text-[#626760]/60">/ 100</span>
            </div>
            <p className="text-[13px] text-[#626760]">
              "Good formula. Clean ingredients."
            </p>
          </div>

          <div className="space-y-2 text-[13px] text-[#626760] pt-2 border-t border-[#EAE5DC]">
            <div className="flex justify-between py-1 border-b border-[#EAE5DC]/50">
              <span>Niacinamide</span>
              <span className="text-[#345447] font-medium">Safe</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#EAE5DC]/50">
              <span>Ceramide NP</span>
              <span className="text-[#345447] font-medium">Safe</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#EAE5DC]/50">
              <span>Hyaluronic Acid</span>
              <span className="text-[#345447] font-medium">Safe</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F6F3EC] text-[12px] text-[#626760] italic leading-snug">
            Tells you what is inside the bottle. Cannot tell you whether putting it on your face will trigger a flare-up.
          </div>
        </div>

        {/* Right: Shelv Personal Decision Intelligence */}
        <div className="mineral-card rounded-2xl p-6 sm:p-8 space-y-5 bg-[#FFFEFB] border-2 border-[#345447] shadow-lg relative">
          <div className="flex items-center justify-between pb-4 border-b border-[#EAE5DC]">
            <span className="text-[12px] font-mono uppercase tracking-widest text-[#345447] font-bold">
              Shelv Personal Intelligence
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#E2EAE4] text-[#345447] font-semibold">
              Context-Aware
            </span>
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-mono font-bold tracking-wider bg-[#FBF4E6] text-[#8A6B2D] border border-[#E8DCB8]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8A6B2D]" />
              NOT NEEDED RIGHT NOW
            </span>
            <h3 className="text-xl font-serif font-bold text-[#171A18] pt-1">
              Active Routine Step Duplication
            </h3>
            <p className="text-[14px] text-[#171A18] leading-relaxed">
              You already use a 10% niacinamide serum in your morning routine. Adding this moisturizer would duplicate that ingredient role without delivering additional barrier benefit.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F6F3EC] border border-[#EAE5DC] space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#345447] font-bold block">
              What to do instead
            </span>
            <p className="text-[13px] text-[#171A18] leading-relaxed">
              Keep your current moisturizer. Only add a product when your skin presents an unmet functional need.
            </p>
          </div>

          <div className="text-[11px] sm:text-[12px] font-mono text-[#345447] flex items-start gap-1.5 pt-1 leading-snug">
            <span className="shrink-0">✓</span>
            <span className="break-words">Evaluates bottle + skin + routine + history</span>
          </div>
        </div>
      </div>
    </section>
  );
}
