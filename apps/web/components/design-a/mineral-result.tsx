'use client';

import React from 'react';
import type { WebQuickRead, WebPersonalFitPreview, ProductIdentity } from '@/lib/derive-intelligence';

interface MineralResultProps {
  quickRead: WebQuickRead | null;
  personalVerdict: WebPersonalFitPreview | null;
  product: ProductIdentity | null;
  onOpenPersonalizer: () => void;
}

export function MineralResult({
  quickRead,
  personalVerdict,
  product,
  onOpenPersonalizer,
}: MineralResultProps) {
  if (!product && !quickRead) return null;

  const currentProduct = product || quickRead?.product;
  const isCaution = personalVerdict?.label === 'USE_WITH_CAUTION';
  const isCouldWork = personalVerdict?.label === 'COULD_WORK';

  return (
    <div className="bg-[#FFFEFB] rounded-2xl border border-[#EAE5DC] shadow-sm overflow-hidden transition-all duration-300">
      {/* Level 2 Personal Decision Banner (if personalized) */}
      {personalVerdict && (
        <div
          className={`p-6 sm:p-7 border-b ${
            isCaution
              ? 'bg-[#FBF4E6]/40 border-[#E8DCB8]'
              : isCouldWork
              ? 'bg-[#E2EAE4]/30 border-[#C4D7CB]'
              : 'bg-[#F6F3EC] border-[#EAE5DC]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-sans font-semibold tracking-wide ${
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
              {isCaution ? 'USE WITH CAUTION' : isCouldWork ? 'COULD WORK' : 'NOT ENOUGH INFO'}
            </span>

            <button
              type="button"
              onClick={onOpenPersonalizer}
              className="text-[12px] font-sans text-[#626760] hover:text-[#171A18] underline underline-offset-2 transition-colors cursor-pointer"
            >
              Edit skin context
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-sans font-semibold text-[#171A18] tracking-tight mb-2">
            {personalVerdict.headline}
          </h2>

          <p className="text-[14px] sm:text-[15px] text-[#626760] leading-relaxed mb-4">
            {personalVerdict.explanation}
          </p>

          {/* Action Guidance Box */}
          <div className="p-4 rounded-xl bg-[#FFFEFB] border border-[#EAE5DC] space-y-1">
            <p className="text-[12px] font-sans font-semibold text-[#171A18]">
              What to do
            </p>
            <p className="text-[13px] text-[#626760] leading-relaxed">
              {personalVerdict.actionGuidance}
            </p>
          </div>

          {/* Evidence Used vs Missing */}
          <div className="mt-4 pt-4 border-t border-[#EAE5DC]/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
            <div>
              <span className="font-medium text-[#171A18] block mb-1">Based on:</span>
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
              <span className="font-medium text-[#171A18] block mb-1">Missing from web check:</span>
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
      <div className="p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-5 border-b border-[#EAE5DC]">
          <div>
            <span className="text-[11px] font-sans font-semibold tracking-wider text-[#626760] uppercase block mb-1">
              {currentProduct?.brand}
            </span>
            <h3 className="text-xl sm:text-2xl font-sans font-bold text-[#171A18] tracking-tight">
              {currentProduct?.name}
            </h3>
          </div>

          <div className="flex items-center gap-2 self-start">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-sans font-medium bg-[#E2EAE4] text-[#345447]">
              {currentProduct?.category?.toUpperCase()}
            </span>
            {currentProduct?.isVerifiedCatalog && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-sans font-medium bg-[#F6F3EC] text-[#626760] border border-[#EAE5DC]">
                Catalog Verified
              </span>
            )}
          </div>
        </div>

        {/* Level 1: What it does (Grouped Rows with Hairline Dividers) */}
        <div className="space-y-4 text-[14px]">
          {/* Primary Role */}
          <div>
            <h4 className="text-[12px] font-sans font-semibold text-[#171A18] uppercase tracking-wider mb-1">
              Primary Role
            </h4>
            <p className="text-[#626760] leading-relaxed">
              {quickRead?.primaryRole || currentProduct?.role}
            </p>
          </div>

          {/* Key Formula Findings */}
          {quickRead && quickRead.keyFormulaFindings.length > 0 && (
            <div className="pt-4 border-t border-[#EAE5DC]">
              <h4 className="text-[12px] font-sans font-semibold text-[#171A18] uppercase tracking-wider mb-2">
                What the Formula Does
              </h4>
              <div className="space-y-2">
                {quickRead.keyFormulaFindings.map((finding, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#345447] mt-2 shrink-0" />
                    <div>
                      <span className="font-medium text-[#171A18]">{finding.title}: </span>
                      <span className="text-[#626760]">{finding.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Things to Know Before Adding */}
          {quickRead && quickRead.stackingConsiderations.length > 0 && (
            <div className="pt-4 border-t border-[#EAE5DC]">
              <h4 className="text-[12px] font-sans font-semibold text-[#171A18] uppercase tracking-wider mb-2">
                Before Adding to Your Routine
              </h4>
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

          {/* Explicit Unknowns */}
          {quickRead && quickRead.unknowns.length > 0 && (
            <div className="pt-4 border-t border-[#EAE5DC]">
              <h4 className="text-[12px] font-sans font-semibold text-[#626760] uppercase tracking-wider mb-1.5">
                What Shelv Doesn't Know Yet
              </h4>
              <ul className="space-y-1 text-[13px] text-[#626760]/80">
                {quickRead.unknowns.map((unknown, idx) => (
                  <li key={idx}>• {unknown}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Level 2 Personalization Trigger (if not yet personalized) */}
        {!personalVerdict && (
          <div className="pt-6 border-t border-[#EAE5DC]">
            <div className="p-4 rounded-xl bg-[#F6F3EC]/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-sans font-semibold text-[#171A18]">
                  Does this fit your face?
                </p>
                <p className="text-[12px] text-[#626760]">
                  Add 15 seconds of context to see whether this actually belongs in your routine.
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenPersonalizer}
                className="bg-[#345447] hover:bg-[#284237] text-[#FFFEFB] text-[13px] font-sans font-medium px-4 py-2 rounded-xl transition-all active:scale-[0.98] shrink-0"
              >
                Make this about your skin →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
