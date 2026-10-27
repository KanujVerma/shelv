'use client';

import React from 'react';
import type { WebQuickRead, WebPersonalFitPreview, ProductIdentity } from '@/lib/derive-intelligence';

interface NativeResultViewProps {
  quickRead: WebQuickRead | null;
  personalVerdict: WebPersonalFitPreview | null;
  product: ProductIdentity | null;
  onOpenSheet: () => void;
}

export function NativeResultView({
  quickRead,
  personalVerdict,
  product,
  onOpenSheet,
}: NativeResultViewProps) {
  if (!product && !quickRead) return null;

  const currentProduct = product || quickRead?.product;
  const isCaution = personalVerdict?.label === 'USE_WITH_CAUTION';
  const isCouldWork = personalVerdict?.label === 'COULD_WORK';

  return (
    <div className="bg-[#FFFEFB] rounded-2xl border border-[#EAE5DC] shadow-sm overflow-hidden text-[#171A18] font-sans">
      {/* Transformed Decision Banner */}
      {personalVerdict && (
        <div
          className={`p-5 border-b ${
            isCaution
              ? 'bg-[#FBF4E6] border-[#E8DCB8]'
              : isCouldWork
              ? 'bg-[#E2EAE4] border-[#C4D7CB]'
              : 'bg-[#F6F3EC] border-[#EAE5DC]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                isCaution
                  ? 'bg-[#8A6B2D] text-[#FFFEFB]'
                  : isCouldWork
                  ? 'bg-[#2D5A43] text-[#FFFEFB]'
                  : 'bg-[#626760] text-[#FFFEFB]'
              }`}
            >
              {isCaution ? 'Use with Caution' : isCouldWork ? 'Could Work' : 'Incomplete'}
            </span>

            <button
              type="button"
              onClick={onOpenSheet}
              className="text-[12px] text-[#626760] hover:text-[#171A18] underline underline-offset-2"
            >
              Edit context ↺
            </button>
          </div>

          <h3 className="text-lg font-semibold text-[#171A18] mb-1">
            {personalVerdict.headline}
          </h3>
          <p className="text-[13px] text-[#626760] leading-relaxed mb-3">
            {personalVerdict.explanation}
          </p>

          <div className="p-3 bg-[#FFFEFB] rounded-xl border border-[#EAE5DC] text-[12px] space-y-0.5">
            <span className="font-semibold text-[#171A18] block">What to do:</span>
            <span className="text-[#626760]">{personalVerdict.actionGuidance}</span>
          </div>
        </div>
      )}

      {/* Product Header */}
      <div className="p-5 border-b border-[#EAE5DC] flex items-start justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold text-[#626760] tracking-wider uppercase block">
            {currentProduct?.brand}
          </span>
          <h2 className="text-xl font-bold text-[#171A18] tracking-tight">
            {currentProduct?.name}
          </h2>
        </div>

        <span className="text-[11px] font-semibold bg-[#E2EAE4] text-[#345447] px-2.5 py-1 rounded-full uppercase shrink-0">
          {currentProduct?.category}
        </span>
      </div>

      {/* Grouped Information Rows */}
      <div className="p-5 space-y-4 text-[13px]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#626760] block mb-1">
            Primary Role
          </span>
          <p className="text-[#171A18]">
            {quickRead?.primaryRole || currentProduct?.role}
          </p>
        </div>

        {quickRead && quickRead.keyFormulaFindings.length > 0 && (
          <div className="pt-3 border-t border-[#EAE5DC]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#626760] block mb-1.5">
              Active Findings
            </span>
            <ul className="space-y-1 text-[#626760]">
              {quickRead.keyFormulaFindings.map((finding, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-[#345447] font-bold">·</span>
                  <span>
                    <strong className="text-[#171A18] font-medium">{finding.title}:</strong> {finding.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {quickRead && quickRead.stackingConsiderations.length > 0 && (
          <div className="pt-3 border-t border-[#EAE5DC]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#626760] block mb-1.5">
              Routine Cautions
            </span>
            <ul className="space-y-1 text-[#626760]">
              {quickRead.stackingConsiderations.map((note, idx) => (
                <li key={idx}>• {note}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Personalization CTA button if not yet personalized */}
        {!personalVerdict && (
          <div className="pt-3 border-t border-[#EAE5DC]">
            <button
              type="button"
              onClick={onOpenSheet}
              className="w-full bg-[#345447] hover:bg-[#284237] text-[#FFFEFB] text-[13px] font-medium py-2.5 rounded-xl transition-all"
            >
              Personalize for your skin (15s) →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
