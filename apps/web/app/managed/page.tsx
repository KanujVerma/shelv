'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TopBar } from '@/components/top-bar';
import { Footer } from '@/components/footer';

export default function ManagedSkincarePage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <>
      <TopBar />

      <main className="flex-1 pt-32 pb-20 px-4 sm:px-8 max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-mono font-bold bg-[#E2EAE4] text-[#345447]">
            Founding Member Beta · $25 / month
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#171A18] tracking-tight">
            Your entire skincare routine, handled.
          </h1>
          <p className="text-[17px] text-[#626760] leading-relaxed max-w-2xl">
            Shelv Managed Skincare is an ongoing cosmetic management program. We design, track, and adapt your routine as your barrier, environment, and skin health evolve.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="mineral-card rounded-2xl p-6 sm:p-7 space-y-3">
            <span className="text-[12px] font-mono text-[#345447] font-bold">01 · ARCHITECTURE</span>
            <h2 className="text-xl font-serif font-bold text-[#171A18]">
              Personalized Morning & Evening Regimen
            </h2>
            <p className="text-[14px] text-[#626760] leading-relaxed">
              We audit every bottle you currently own and organize an evidence-backed morning and night schedule, eliminating duplicate roles and active clashes.
            </p>
          </div>

          <div className="mineral-card rounded-2xl p-6 sm:p-7 space-y-3">
            <span className="text-[12px] font-mono text-[#345447] font-bold">02 · ADAPTATION</span>
            <h2 className="text-xl font-serif font-bold text-[#171A18]">
              Seasonal & Climate Calibration
            </h2>
            <p className="text-[14px] text-[#626760] leading-relaxed">
              When humidity drops in winter or UV indices spike in summer, Shelv adjusts your hydration layers and active frequency before barrier degradation begins.
            </p>
          </div>

          <div className="mineral-card rounded-2xl p-6 sm:p-7 space-y-3">
            <span className="text-[12px] font-mono text-[#345447] font-bold">03 · CLEARANCE</span>
            <h2 className="text-xl font-serif font-bold text-[#171A18]">
              Pre-Purchase Product Clearances
            </h2>
            <p className="text-[14px] text-[#626760] leading-relaxed">
              Never buy a product that breaks your routine again. Run any prospective bottle through your dedicated manager to receive an instant fit verdict.
            </p>
          </div>

          <div className="mineral-card rounded-2xl p-6 sm:p-7 space-y-3">
            <span className="text-[12px] font-mono text-[#345447] font-bold">04 · INDEPENDENCE</span>
            <h2 className="text-xl font-serif font-bold text-[#171A18]">
              Zero Brand Affiliation
            </h2>
            <p className="text-[14px] text-[#626760] leading-relaxed">
              Products are purchased separately from whichever retailers you prefer. We accept zero kickbacks, so our guidance is always 100% aligned with your skin.
            </p>
          </div>
        </div>

        {/* Founding Beta Intake */}
        <div className="mineral-card rounded-3xl p-8 sm:p-10 bg-[#FFFEFB] border border-[#345447]/30 shadow-md space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-[#171A18]">
              Join the Founding Waitlist
            </h2>
            <p className="text-[15px] text-[#626760] leading-relaxed">
              Beta membership is limited to ensure personalized calibration for every member. Enter your email to receive an invitation code.
            </p>
          </div>

          {submitted ? (
            <div className="p-4 rounded-xl bg-[#E2EAE4] text-[#345447] text-[15px] font-medium text-center">
              ✓ Thank you. You have been added to the private waitlist. We will notify you when enrollment opens.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address..."
                className="flex-1 px-4 py-3.5 rounded-full bg-[#F6F3EC] border border-[#EAE5DC] text-[15px] text-[#171A18] placeholder-[#626760]/70 focus:outline-none focus:border-[#345447]"
              />
              <button
                type="submit"
                className="bg-[#345447] hover:bg-[#284237] text-[#FFFEFB] text-[15px] font-medium px-8 py-3.5 rounded-full transition-all shadow-sm active:scale-95 whitespace-nowrap text-center"
              >
                Request Beta Invitation
              </button>
            </form>
          )}

          <div className="text-[12px] font-mono text-[#626760] pt-2">
            $25/month billed during active membership · Cancel anytime inside the app
          </div>
        </div>

        <div className="text-center pt-4">
          <Link href="/" className="text-[14px] text-[#345447] hover:underline font-medium">
            ← Back to Free Product Check
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
