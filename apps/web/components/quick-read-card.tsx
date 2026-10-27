'use client';

import React from 'react';
import type { WebQuickRead } from '@/lib/derive-intelligence';

interface QuickReadCardProps {
  quickRead: WebQuickRead;
  onPersonalizeClick: () => void;
  isPersonalized?: boolean;
}

export function QuickReadCard({
  quickRead,
  onPersonalizeClick,
  isPersonalized = false,
}: QuickReadCardProps) {
  const { product, summary, primaryRole, targetConcerns, keyFormulaFindings, stackingConsiderations, unknowns } = quickRead;
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/?check=${encodeURIComponent(product.sourceUrl || product.name)}`;
      navigator.clipboard?.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mineral-card rounded-2xl p-6 sm:p-8 space-y-6 transition-all">
      {/* Header Badge & Product Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#EAE5DC]">
        <div>
          <span className="text-[12px] font-mono uppercase tracking-widest text-[#626760]">
            {product.brand}
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#171A18] mt-0.5">
            {product.name}
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-[#E2EAE4] text-[#345447]">
            {product.category.toUpperCase()}
          </span>
          {product.isVerifiedCatalog && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-[#FFFEFB] border border-[#EAE5DC] text-[#626760]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#345447]" />
              Catalog Verified
            </span>
          )}
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-[#F6F3EC] hover:bg-[#EAE5DC] text-[#626760] transition-colors active:scale-95"
          >
            {copied ? '✓ Copied' : '↗ Share'}
          </button>
        </div>
      </div>

      {/* Main Role & Summary */}
      <div className="space-y-2">
        <h3 className="text-[13px] font-mono uppercase tracking-wider text-[#626760]">
          Primary Role
        </h3>
        <p className="text-[16px] text-[#171A18] leading-relaxed font-sans font-medium">
          {primaryRole}
        </p>
        <p className="text-[14px] text-[#626760] leading-relaxed">
          {summary}
        </p>
      </div>

      {/* Concerns Targeted */}
      <div className="space-y-2">
        <h3 className="text-[13px] font-mono uppercase tracking-wider text-[#626760]">
          Most Relevant Use Cases
        </h3>
        <div className="flex flex-wrap gap-2">
          {targetConcerns.map((concern, i) => (
            <span
              key={i}
              className="text-[13px] px-3 py-1 rounded-full bg-[#F6F3EC] border border-[#EAE5DC] text-[#171A18]"
            >
              {concern}
            </span>
          ))}
        </div>
      </div>

      {/* Formula & Product Findings */}
      {keyFormulaFindings.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-[13px] font-mono uppercase tracking-wider text-[#626760]">
            Supported Formula Findings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {keyFormulaFindings.map((finding, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-[#F6F3EC]/70 border border-[#EAE5DC] space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#345447]" />
                  <span className="text-[14px] font-medium text-[#171A18]">
                    {finding.title}
                  </span>
                </div>
                <p className="text-[13px] text-[#626760] leading-snug">
                  {finding.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Things that matter before adding */}
      {stackingConsiderations.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <h3 className="text-[13px] font-mono uppercase tracking-wider text-[#626760]">
            Things That Matter Before Adding
          </h3>
          <ul className="space-y-2">
            {stackingConsiderations.map((note, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-[14px] text-[#171A18] leading-relaxed"
              >
                <span className="text-[#345447] font-bold text-[16px] leading-tight select-none">
                  •
                </span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Explicit Unknowns */}
      <div className="p-4 rounded-xl bg-[#FBF4E6]/50 border border-[#E8DCB8]/60 space-y-2">
        <div className="flex items-center gap-2 text-[#8A6B2D] text-[13px] font-medium">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-mono uppercase tracking-wider text-[12px]">What Shelv does not know yet</span>
        </div>
        <ul className="space-y-1 text-[13px] text-[#626760]">
          {unknowns.map((unk, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-[#8A6B2D]">•</span>
              <span>{unk}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Level 2 Personalization Bridge Callout */}
      {!isPersonalized && (
        <div className="pt-4 border-t border-[#EAE5DC] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-[15px] font-medium text-[#171A18]">
              Does this make sense for your skin?
            </p>
            <p className="text-[13px] text-[#626760]">
              Give Shelv ~15 seconds of context to evaluate personal fit.
            </p>
          </div>
          <button
            onClick={onPersonalizeClick}
            className="w-full sm:w-auto shrink-0 bg-[#345447] hover:bg-[#284237] text-[#FFFEFB] text-[14px] font-medium px-6 py-3 rounded-full transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Personalize this result</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </div>
  );
}
