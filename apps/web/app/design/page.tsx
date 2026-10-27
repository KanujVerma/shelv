import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Shelv Design Lab | Direction Exploration',
  description: 'Three distinct visual directions for the Shelv web acquisition surface.',
};

const BHA_URL = 'https://www.paulaschoice.com/skin-perfecting-2pct-bha-liquid-exfoliant/201.html';
const PERSONAL_PARAMS = '&reactivity=reacts_easily&treatments=topical_retinoid&goals=texture';

export default function DesignLabIndex() {
  return (
    <div className="min-h-screen bg-[#F6F3EC] text-[#171A18] font-sans antialiased p-6 sm:p-12 selection:bg-[#E2EAE4] selection:text-[#345447]">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-3 border-b border-[#EAE5DC] pb-8">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-2xl tracking-tight text-[#171A18]">
              SHELV
            </span>
            <span className="text-[12px] bg-[#E2EAE4] text-[#345447] px-2.5 py-0.5 rounded-full font-semibold">
              Design Lab
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#171A18]">
            Visual Taste & Interface Direction Exploration
          </h1>
          <p className="text-[15px] text-[#626760] max-w-2xl leading-relaxed">
            This lab isolates three distinct visual directions for the Shelv web acquisition surface. All three adhere to the same immutable product truth, deterministic decision rules, benchmark catalog, and privacy boundaries.
          </p>
        </div>

        {/* Direction Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Direction A */}
          <div className="bg-[#FFFEFB] rounded-2xl border border-[#EAE5DC] p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#345447] bg-[#E2EAE4] px-2 py-0.5 rounded-full">
                  Direction A
                </span>
                <span className="text-[11px] text-[#626760]">~75% Apple / 25% Brand</span>
              </div>
              <h2 className="text-xl font-semibold text-[#171A18]">
                Mineral Glass
              </h2>
              <p className="text-[13px] text-[#626760] leading-relaxed">
                The closest web expression of the native Shelv iOS app. System-ui sans typography, floating liquid-glass composer, grouped mineral surfaces, and restrained tactile spring interactions.
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-[#EAE5DC] text-[12px]">
              <span className="font-semibold text-[#171A18] block">Interactive States:</span>
              <div className="space-y-1">
                <Link
                  href="/design/mineral-glass"
                  className="block text-[#345447] hover:underline font-medium"
                >
                  1. Idle Homepage →
                </Link>
                <Link
                  href={`/design/mineral-glass?check=${encodeURIComponent(BHA_URL)}`}
                  className="block text-[#345447] hover:underline font-medium"
                >
                  2. Resolved Quick Read →
                </Link>
                <Link
                  href={`/design/mineral-glass?check=${encodeURIComponent(BHA_URL)}${PERSONAL_PARAMS}`}
                  className="block text-[#345447] hover:underline font-medium"
                >
                  3. Transformed Decision (Caution) →
                </Link>
              </div>
            </div>
          </div>

          {/* Direction B */}
          <div className="bg-[#FFFEFB] rounded-2xl border border-[#EAE5DC] p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#171A18] bg-[#F6F3EC] px-2 py-0.5 rounded-full border border-[#EAE5DC]">
                  Direction B
                </span>
                <span className="text-[11px] text-[#626760]">Typology / Aesop Craft</span>
              </div>
              <h2 className="text-xl font-semibold text-[#171A18]">
                Editorial Intelligence
              </h2>
              <p className="text-[13px] text-[#626760] leading-relaxed">
                More expressive premium brand experience. Asymmetrical editorial composition, high-craft typography, generous negative space, 2-column formula anatomy, and literary clarity without SaaS cards.
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-[#EAE5DC] text-[12px]">
              <span className="font-semibold text-[#171A18] block">Interactive States:</span>
              <div className="space-y-1">
                <Link
                  href="/design/editorial"
                  className="block text-[#171A18] hover:underline font-medium"
                >
                  1. Idle Homepage →
                </Link>
                <Link
                  href={`/design/editorial?check=${encodeURIComponent(BHA_URL)}`}
                  className="block text-[#171A18] hover:underline font-medium"
                >
                  2. Resolved Quick Read →
                </Link>
                <Link
                  href={`/design/editorial?check=${encodeURIComponent(BHA_URL)}${PERSONAL_PARAMS}`}
                  className="block text-[#171A18] hover:underline font-medium"
                >
                  3. Transformed Decision (Caution) →
                </Link>
              </div>
            </div>
          </div>

          {/* Direction C */}
          <div className="bg-[#FFFEFB] rounded-2xl border border-[#EAE5DC] p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#626760] bg-[#EDE8DF] px-2 py-0.5 rounded-full">
                  Direction C
                </span>
                <span className="text-[11px] text-[#626760]">Native iOS Utility</span>
              </div>
              <h2 className="text-xl font-semibold text-[#171A18]">
                Native Utility
              </h2>
              <p className="text-[13px] text-[#626760] leading-relaxed">
                Eliminates the traditional landing page completely. The demo IS the marketing. Immediate central input tool, native iOS bottom sheet for personalization, grouped product sections, and zero pitch-deck clutter.
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-[#EAE5DC] text-[12px]">
              <span className="font-semibold text-[#171A18] block">Interactive States:</span>
              <div className="space-y-1">
                <Link
                  href="/design/native"
                  className="block text-[#345447] hover:underline font-medium"
                >
                  1. Idle Homepage →
                </Link>
                <Link
                  href={`/design/native?check=${encodeURIComponent(BHA_URL)}`}
                  className="block text-[#345447] hover:underline font-medium"
                >
                  2. Resolved Quick Read →
                </Link>
                <Link
                  href={`/design/native?check=${encodeURIComponent(BHA_URL)}${PERSONAL_PARAMS}`}
                  className="block text-[#345447] hover:underline font-medium"
                >
                  3. Transformed Decision (Caution) →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-[#EAE5DC] pt-6 flex items-center justify-between text-[12px] text-[#626760]">
          <span>Canonical homepage at <Link href="/" className="underline">/ (Preserved unchanged)</Link></span>
          <span>Shelv Web Design Lab · 2026</span>
        </div>
      </div>
    </div>
  );
}
