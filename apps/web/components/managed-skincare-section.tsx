'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function ManagedSkincareSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <section id="managed" className="py-20 px-4 sm:px-8 max-w-4xl mx-auto border-t border-[#EAE5DC]">
      <div className="mineral-card rounded-3xl p-8 sm:p-12 space-y-8 bg-[#FFFEFB] border border-[#EAE5DC] relative overflow-hidden">
        {/* Subtle decorative sage accent hairline */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#345447]" />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[12px] font-mono uppercase tracking-widest text-[#345447] font-bold">
              Founding Beta
            </span>
            <span className="text-[13px] font-mono font-bold text-[#171A18] bg-[#F6F3EC] px-3 py-1 rounded-full border border-[#EAE5DC]">
              $25 / month
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#171A18]">
            Want Shelv to handle your whole routine?
          </h2>

          <p className="text-[15px] sm:text-[16px] text-[#626760] leading-relaxed max-w-2xl">
            Check solves individual product questions. Managed Skincare organizes your entire morning and evening routine, monitors barrier adaptation, and guides seasonal adjustments.
          </p>
        </div>

        {/* What's included */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="flex items-start gap-3">
            <span className="text-[#345447] font-bold text-lg select-none">•</span>
            <div>
              <div className="text-[14px] font-bold text-[#171A18]">Architected Morning & Night Regimen</div>
              <div className="text-[13px] text-[#626760]">Curated around your barrier needs and active tolerances.</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-[#345447] font-bold text-lg select-none">•</span>
            <div>
              <div className="text-[14px] font-bold text-[#171A18]">Seasonal Routine Adaptation</div>
              <div className="text-[13px] text-[#626760]">Automated adjustments as humidity and climate shift.</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-[#345447] font-bold text-lg select-none">•</span>
            <div>
              <div className="text-[14px] font-bold text-[#171A18]">Pre-Purchase Clearances</div>
              <div className="text-[13px] text-[#626760]">Ask before you buy so you never waste money on products you cannot use.</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-[#345447] font-bold text-lg select-none">•</span>
            <div>
              <div className="text-[14px] font-bold text-[#171A18]">Products Purchased Separately</div>
              <div className="text-[13px] text-[#626760]">Zero brand kickbacks. We never push formulas to earn an affiliate commission.</div>
            </div>
          </div>
        </div>

        {/* Waitlist Intake */}
        <div className="pt-4 border-t border-[#EAE5DC]">
          {submitted ? (
            <div className="p-4 rounded-xl bg-[#E2EAE4] text-[#345447] text-[14px] font-medium text-center">
              ✓ You're on the founding waitlist. We invite members in small batches to preserve support quality.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email for beta access..."
                className="flex-1 px-4 py-3 rounded-full bg-[#F6F3EC] border border-[#EAE5DC] text-[14px] text-[#171A18] placeholder-[#626760]/70 focus:outline-none focus:border-[#345447]"
              />
              <button
                type="submit"
                className="bg-[#345447] hover:bg-[#284237] text-[#FFFEFB] text-[14px] font-medium px-8 py-3 rounded-full transition-all shadow-sm active:scale-95 text-center whitespace-nowrap"
              >
                Join the beta waitlist
              </button>
            </form>
          )}

          <div className="mt-3 text-center sm:text-left">
            <Link
              href="/managed"
              className="text-[13px] text-[#345447] hover:underline font-medium"
            >
              Read full Managed Skincare overview →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
