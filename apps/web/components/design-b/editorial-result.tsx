'use client';

import React from 'react';
import type { WebQuickRead, WebPersonalFitPreview, ProductIdentity } from '@/lib/derive-intelligence';

interface EditorialResultProps {
  quickRead: WebQuickRead | null;
  personalVerdict: WebPersonalFitPreview | null;
  product: ProductIdentity | null;
  onOpenPersonalizer: () => void;
}

export function EditorialResult({
  quickRead,
  personalVerdict,
  product,
  onOpenPersonalizer,
}: EditorialResultProps) {
  if (!product && !quickRead) return null;

  const currentProduct = product || quickRead?.product;
  const isCaution = personalVerdict?.label === 'USE_WITH_CAUTION';
  const isCouldWork = personalVerdict?.label === 'COULD_WORK';

  return (
    <div className="space-y-10">
      {/* Transformed Editorial Decision Banner */}
      {personalVerdict && (
        <div
          className={`p-6 sm:p-8 rounded-xl border ${
            isCaution
              ? 'bg-[#FBF4E6]/50 border-[#E8DCB8]'
              : isCouldWork
              ? 'bg-[#E2EAE4]/40 border-[#C4D7CB]'
              : 'bg-[#FFFEFB] border-[#EAE5DC]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-[#EAE5DC] mb-4">
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-sans font-semibold uppercase tracking-widest text-[#626760]">
                Personal Assessment
              </span>
              <span
                className={`text-[12px] font-sans font-bold px-2.5 py-0.5 rounded-full ${
                  isCaution
                    ? 'bg-[#FBF4E6] text-[#8A6B2D] border border-[#E8DCB8]'
                    : isCouldWork
                    ? 'bg-[#E2EAE4] text-[#2D5A43] border border-[#C4D7CB]'
                    : 'bg-[#F6F3EC] text-[#626760]'
                }`}
              >
                {isCaution ? 'Use with Caution' : isCouldWork ? 'Could Work' : 'Incomplete Evidence'}
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenPersonalizer}
              className="text-[12px] font-sans text-[#626760] hover:text-[#171A18] underline underline-offset-2 transition-colors cursor-pointer"
            >
              Modify context ↺
            </button>
          </div>

          <h3 className="text-xl sm:text-2xl font-serif font-medium text-[#171A18] mb-2">
            {personalVerdict.headline}
          </h3>

          <p className="text-[14px] sm:text-[15px] text-[#626760] leading-relaxed mb-6 max-w-3xl">
            {personalVerdict.explanation}
          </p>

          <div className="p-4 rounded-lg bg-[#FFFEFB] border border-[#EAE5DC] space-y-1 mb-6">
            <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-[#171A18] block">
              Recommendation
            </span>
            <p className="text-[13px] text-[#626760] leading-relaxed">
              {personalVerdict.actionGuidance}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px] text-[#626760] pt-4 border-t border-[#EAE5DC]/60">
            <div>
              <span className="font-semibold text-[#171A18] block mb-1">Evidence evaluated:</span>
              <ul className="space-y-0.5">
                {personalVerdict.evidenceUsed.map((item, idx) => (
                  <li key={idx}>— {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-semibold text-[#171A18] block mb-1">Missing for full routine confidence:</span>
              <ul className="space-y-0.5">
                {personalVerdict.missingEvidence.map((item, idx) => (
                  <li key={idx}>— {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Product Heading: Typology / Aesop Inspired Typography */}
      <div className="border-b border-[#EAE5DC] pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <span className="text-[12px] font-sans font-semibold uppercase tracking-widest text-[#626760]">
            {currentProduct?.brand} · {currentProduct?.category?.toUpperCase()}
          </span>
          {currentProduct?.isVerifiedCatalog && (
            <span className="text-[11px] font-sans text-[#345447] bg-[#E2EAE4] px-2.5 py-0.5 rounded-full font-medium">
              Authoritative Formula Verified
            </span>
          )}
        </div>

        <h2 className="text-2xl sm:text-4xl font-serif font-normal text-[#171A18] tracking-tight">
          {currentProduct?.name}
        </h2>
      </div>

      {/* Two-Column Factual Chemistry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Role & Mechanisms */}
        <div className="md:col-span-7 space-y-6">
          <div>
            <h4 className="text-[12px] font-sans font-semibold uppercase tracking-wider text-[#171A18] mb-2">
              Primary Cosmetic Role
            </h4>
            <p className="text-[15px] font-serif text-[#171A18] leading-relaxed">
              {quickRead?.primaryRole || currentProduct?.role}
            </p>
          </div>

          {quickRead && quickRead.keyFormulaFindings.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-[#EAE5DC]">
              <h4 className="text-[12px] font-sans font-semibold uppercase tracking-wider text-[#171A18]">
                Formula Mechanics
              </h4>
              <div className="space-y-3">
                {quickRead.keyFormulaFindings.map((finding, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <p className="text-[14px] font-sans font-medium text-[#171A18]">
                      {finding.title}
                    </p>
                    <p className="text-[13px] text-[#626760] leading-relaxed">
                      {finding.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Routine Considerations & Unknowns */}
        <div className="md:col-span-5 space-y-6 md:border-l md:border-[#EAE5DC] md:pl-8">
          {quickRead && quickRead.stackingConsiderations.length > 0 && (
            <div>
              <h4 className="text-[12px] font-sans font-semibold uppercase tracking-wider text-[#171A18] mb-2">
                Routine Stacking Notes
              </h4>
              <ul className="space-y-2 text-[13px] text-[#626760] leading-relaxed">
                {quickRead.stackingConsiderations.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#171A18] shrink-0">—</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {quickRead && quickRead.unknowns.length > 0 && (
            <div className="pt-4 border-t border-[#EAE5DC]">
              <h4 className="text-[12px] font-sans font-semibold uppercase tracking-wider text-[#626760] mb-2">
                Limits of Web Resolution
              </h4>
              <ul className="space-y-1.5 text-[12px] text-[#626760]/80">
                {quickRead.unknowns.map((unknown, idx) => (
                  <li key={idx}>• {unknown}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Context Trigger */}
          {!personalVerdict && (
            <div className="pt-4">
              <button
                type="button"
                onClick={onOpenPersonalizer}
                className="w-full bg-[#171A18] hover:bg-[#345447] text-[#FFFEFB] text-[13px] font-sans font-medium py-3 px-4 rounded-lg transition-all"
              >
                Test against your skin →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
