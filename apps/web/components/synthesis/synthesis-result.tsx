'use client';

import React from 'react';
import type { WebQuickRead, WebPersonalFitPreview, ProductIdentity } from '@/lib/derive-intelligence';

interface SynthesisResultProps {
  quickRead: WebQuickRead | null;
  personalVerdict: WebPersonalFitPreview | null;
  product: ProductIdentity | null;
  onOpenSheet: () => void;
}

export function SynthesisResult({
  quickRead,
  personalVerdict,
  product,
  onOpenSheet,
}: SynthesisResultProps) {
  if (!product && !quickRead) return null;

  const currentProduct = product || quickRead?.product;
  const isCaution = personalVerdict?.label === 'USE_WITH_CAUTION';
  const isCouldWork = personalVerdict?.label === 'COULD_WORK';

  return (
    <div className="bg-[#FFFEFB] rounded-2xl border border-[#EAE5DC] shadow-sm overflow-hidden text-[#171A18] font-sans transition-all duration-300">
      {/* Level 2: Transformed Decision Banner */}
      {personalVerdict && (
        <div
          className={`p-5 sm:p-6 border-b ${
            isCaution
              ? 'bg-[#FBF4E6]/50 border-[#E8DCB8]'
              : isCouldWork
              ? 'bg-[#E2EAE4]/40 border-[#C4D7CB]'
              : 'bg-[#F6F3EC] border-[#EAE5DC]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold tracking-wide ${
                isCaution
                  ? 'bg-[#FBF4E6] text-[#8A6B2D] border border-[#E8DCB8]'
                  : isCouldWork
                  ? 'bg-[#E2EAE4] text-[#2D5A43] border border-[#C4D7CB]'
                  : 'bg-[#F6F3EC] text-[#626760] border border-[#EAE5DC]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCaution ? 'bg-[#8A6B2D]' : isCouldWork ? 'bg-[#2D5A43]' : 'bg-[#626760]'
                }`}
              />
              {isCaution ? 'USE WITH CAUTION' : isCouldWork ? 'COULD WORK' : 'INCOMPLETE'}
            </span>

            <button
              type="button"
              onClick={onOpenSheet}
              className="text-[12px] text-[#626760] hover:text-[#171A18] underline underline-offset-2 transition-colors cursor-pointer"
            >
              Edit skin context ↺
            </button>
          </div>

          <h3 className="text-xl sm:text-2xl font-semibold text-[#171A18] tracking-tight mb-2">
            {personalVerdict.headline}
          </h3>

          <p className="text-[14px] text-[#626760] leading-relaxed mb-4">
            {personalVerdict.explanation}
          </p>

          {/* Action Guidance Box */}
          <div className="p-4 rounded-xl bg-[#FFFEFB] border border-[#EAE5DC] space-y-1 mb-4">
            <span className="text-[12px] font-semibold text-[#171A18] block">
              What to do
            </span>
            <p className="text-[13px] text-[#626760] leading-relaxed">
              {personalVerdict.actionGuidance}
            </p>
          </div>

          {/* Evidence Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px] pt-3 border-t border-[#EAE5DC]/60">
            <div>
              <span className="font-semibold text-[#171A18] block mb-1">Based on:</span>
              <ul className="text-[#626760] space-y-0.5">
                {personalVerdict.evidenceUsed.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="text-[#345447]">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-semibold text-[#171A18] block mb-1">Missing from web check:</span>
              <ul className="text-[#626760] space-y-0.5">
                {personalVerdict.missingEvidence.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="text-[#8A6B2D] opacity-80">?</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Product Heading (Native App Style) */}
      <div className="p-5 sm:p-6 border-b border-[#EAE5DC]">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-[#626760] tracking-wider uppercase block mb-1">
              {currentProduct?.brand}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#171A18] tracking-tight">
              {currentProduct?.name}
            </h2>
          </div>

          <div className="flex items-center gap-2 self-start">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#E2EAE4] text-[#345447] uppercase">
              {currentProduct?.category}
            </span>
            {currentProduct?.isVerifiedCatalog && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#F6F3EC] text-[#626760] border border-[#EAE5DC]">
                Catalog Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grouped Information Rows */}
      <div className="p-5 sm:p-6 space-y-4 text-[13px]">
        {/* Primary Role */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#626760] block mb-1">
            Primary Role
          </span>
          <p className="text-[14px] text-[#171A18] leading-relaxed">
            {quickRead?.primaryRole || currentProduct?.role}
          </p>
        </div>

        {/* Active Findings */}
        {quickRead && quickRead.keyFormulaFindings.length > 0 && (
          <div className="pt-3 border-t border-[#EAE5DC]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#626760] block mb-2">
              Formula Findings
            </span>
            <div className="space-y-2">
              {quickRead.keyFormulaFindings.map((finding, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#345447] mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-[#171A18]">{finding.title}: </span>
                    <span className="text-[#626760]">{finding.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Routine Cautions */}
        {quickRead && quickRead.stackingConsiderations.length > 0 && (
          <div className="pt-3 border-t border-[#EAE5DC]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#626760] block mb-1.5">
              Before Adding to Routine
            </span>
            <ul className="space-y-1.5 text-[#626760]">
              {quickRead.stackingConsiderations.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#626760]/60 shrink-0">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Limits of Web Check */}
        {quickRead && quickRead.unknowns.length > 0 && (
          <div className="pt-3 border-t border-[#EAE5DC]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#626760] block mb-1.5">
              What Shelv Doesn't Know Yet
            </span>
            <ul className="space-y-1 text-[12px] text-[#626760]/80">
              {quickRead.unknowns.map((unknown, idx) => (
                <li key={idx}>• {unknown}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Personalize Button (if not yet personalized) */}
        {!personalVerdict && (
          <div className="pt-4 border-t border-[#EAE5DC]">
            <button
              type="button"
              onClick={onOpenSheet}
              className="w-full bg-[#345447] hover:bg-[#284237] text-[#FFFEFB] text-[13px] font-medium py-3 rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
            >
              <span>Personalize for your skin (15s)</span>
              <span>→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
