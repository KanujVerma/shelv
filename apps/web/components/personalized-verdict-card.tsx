'use client';

import React from 'react';
import type { WebPersonalFitPreview, ProductIdentity } from '@/lib/derive-intelligence';

interface PersonalizedVerdictCardProps {
  verdict: WebPersonalFitPreview;
  product: ProductIdentity;
  onEditContext: () => void;
}

export function PersonalizedVerdictCard({
  verdict,
  product,
  onEditContext,
}: PersonalizedVerdictCardProps) {
  const { label, headline, explanation, actionGuidance, reasons, evidenceUsed, missingEvidence, sources } = verdict;

  const isCaution = label === 'USE_WITH_CAUTION';
  const isCouldWork = label === 'COULD_WORK';

  return (
    <div
      className={`rounded-2xl p-6 sm:p-8 space-y-6 transition-all duration-300 border ${
        isCaution
          ? 'bg-[#FFFEFB] border-[#E8DCB8] shadow-md'
          : isCouldWork
          ? 'bg-[#FFFEFB] border-[#C4D7CB] shadow-md'
          : 'mineral-card'
      }`}
    >
      {/* Category Decision Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#EAE5DC]">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {isCaution && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold font-mono tracking-wider bg-[#FBF4E6] text-[#8A6B2D] border border-[#E8DCB8]">
                <span className="w-2 h-2 rounded-full bg-[#8A6B2D]" />
                USE WITH CAUTION
              </span>
            )}
            {isCouldWork && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold font-mono tracking-wider bg-[#E2EAE4] text-[#345447] border border-[#C4D7CB]">
                <span className="w-2 h-2 rounded-full bg-[#345447]" />
                COULD WORK
              </span>
            )}
            {!isCaution && !isCouldWork && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold font-mono tracking-wider bg-[#F6F3EC] text-[#626760] border border-[#EAE5DC]">
                <span className="w-2 h-2 rounded-full bg-[#626760]" />
                NOT ENOUGH INFORMATION
              </span>
            )}
            <span className="text-[12px] font-mono text-[#626760]">
              Personalized for your skin
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#171A18]">
            {headline}
          </h2>
        </div>

        <button
          onClick={onEditContext}
          className="text-[13px] font-medium text-[#345447] hover:underline self-start sm:self-auto py-1 px-2 -mx-2 rounded"
        >
          Edit your context ↺
        </button>
      </div>

      {/* Primary Explanation */}
      <div className="space-y-2">
        <p className="text-[15px] sm:text-[16px] text-[#171A18] leading-relaxed">
          {explanation}
        </p>
      </div>

      {/* Concrete Guidance: "What I'd do" */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#F6F3EC] border border-[#EAE5DC] space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#345447]" />
          <h3 className="text-[13px] font-mono uppercase tracking-wider text-[#171A18] font-bold">
            What I'd Do
          </h3>
        </div>
        <p className="text-[14px] text-[#171A18] leading-relaxed font-medium">
          {actionGuidance}
        </p>
      </div>

      {/* Decision Basis & Evidence Boundary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {/* Evidence Used */}
        <div className="p-3.5 rounded-xl bg-[#FFFEFB] border border-[#EAE5DC] space-y-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#626760] font-semibold">
            Evidence Used
          </span>
          <ul className="space-y-1 text-[13px] text-[#171A18]">
            {evidenceUsed.map((ev, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-[#345447] font-bold">✓</span>
                <span>{ev}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Missing Evidence */}
        <div className="p-3.5 rounded-xl bg-[#FFFEFB] border border-[#EAE5DC] space-y-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#626760] font-semibold">
            Missing / Unknown
          </span>
          <ul className="space-y-1 text-[13px] text-[#626760]">
            {missingEvidence.map((ev, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-[#8A6B2D]">?</span>
                <span>{ev}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Public References */}
      {sources.length > 0 && (
        <div className="pt-2 text-[12px] text-[#626760] flex items-center gap-2 flex-wrap">
          <span>Clinical & Safety Source:</span>
          {sources.map((src, i) => (
            <a
              key={i}
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#345447] underline hover:text-[#171A18]"
            >
              AAD Dermatology Guidance ↗
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
