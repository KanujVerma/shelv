'use client';

import React, { useState } from 'react';

const STAGES = [
  {
    id: 1,
    title: 'Product Only',
    tag: 'No Context',
    description: 'Raw formula and manufacturer facts',
    badge: 'GENERAL FACTS',
    badgeType: 'neutral',
    verdictTitle: 'Leave-on Chemical Exfoliant',
    verdictBody:
      'Formulated with 2% salicylic acid in a hydrating fluid vehicle. Targets keratin plugs and sebum inside pores. pH 3.5–3.9.',
    advice: 'Perform patch test before initial use.',
  },
  {
    id: 2,
    title: '+ Your Goals',
    tag: 'Breakouts & Texture',
    description: 'Stated concerns & target outcomes',
    badge: 'MECHANISM FIT',
    badgeType: 'positive',
    verdictTitle: 'Functional Match for Breakouts',
    verdictBody:
      'Oil-soluble BHA directly addresses your reported clogged pore and rough texture concerns by dissolving follicular sebum.',
    advice: 'Can serve as your primary evening exfoliating step.',
  },
  {
    id: 3,
    title: '+ Current Routine',
    tag: 'Using Tretinoin 0.05%',
    description: 'Existing morning & night shelf',
    badge: 'ACTIVE COLLISION',
    badgeType: 'warning',
    verdictTitle: 'Use With Caution: Retinoid Stacking',
    verdictBody:
      'You are already using a nightly prescription retinoid. Applying BHA at the same time compounds stratum corneum thinning and accelerates transepidermal water loss.',
    advice: 'Do not layer concurrently. Alternate nights or use BHA exclusively on retinoid rest evenings.',
  },
  {
    id: 4,
    title: '+ Skin History',
    tag: 'Winter Flare-up in Nov',
    description: 'Prior reactions & seasonal sensitivity',
    badge: 'CUSTOM PROTOCOL',
    badgeType: 'custom',
    verdictTitle: 'Buffered Alternate Protocol',
    verdictBody:
      'Because your skin experienced barrier flaking last winter while using retinoids, introducing this acid requires preemptive barrier buffering.',
    advice: 'Limit to 1 night weekly over a ceramide moisturizer until seasonal tolerance is verified.',
  },
];

export function ProgressiveContextSection() {
  const [activeStage, setActiveStage] = useState(1);
  const current = STAGES[activeStage - 1];

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-8 max-w-5xl mx-auto border-t border-[#EAE5DC]">
      <div className="text-center space-y-3 mb-12">
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#171A18] tracking-tight">
          Shelv gets sharper with context.
        </h2>
        <p className="text-[16px] text-[#626760] max-w-2xl mx-auto leading-relaxed">
          The exact same product produces completely different guidance as Shelv learns your skin. Click through the layers below:
        </p>
      </div>

      {/* Interactive Step Navigator */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
        {STAGES.map((stage) => {
          const isActive = activeStage === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className={`p-3.5 sm:p-4 rounded-xl text-left border transition-all ${
                isActive
                  ? 'bg-[#345447] text-[#FFFEFB] border-[#345447] shadow-md'
                  : 'bg-[#FFFEFB] text-[#171A18] border-[#EAE5DC] hover:border-[#DDD6C9]'
              }`}
            >
              <div
                className={`text-[11px] font-mono uppercase tracking-wider mb-1 ${
                  isActive ? 'text-[#E2EAE4]' : 'text-[#626760]'
                }`}
              >
                Layer 0{stage.id}
              </div>
              <div className="text-[14px] font-bold leading-tight mb-1">
                {stage.title}
              </div>
              <div
                className={`text-[12px] truncate ${
                  isActive ? 'text-[#FFFEFB]/80' : 'text-[#626760]'
                }`}
              >
                {stage.tag}
              </div>
            </button>
          );
        })}
      </div>

      {/* Dynamic Result Card */}
      <div className="mineral-card rounded-2xl p-6 sm:p-8 space-y-5 bg-[#FFFEFB] border border-[#EAE5DC] shadow-sm transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE5DC]">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] sm:text-[12px] font-mono uppercase tracking-wider text-[#626760] block break-words">
              Example: Paula's Choice 2% BHA Liquid
            </span>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#171A18]">
              {current.verdictTitle}
            </h3>
          </div>

          <div>
            {current.badgeType === 'positive' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-mono font-bold bg-[#E2EAE4] text-[#345447] border border-[#C4D7CB]">
                {current.badge}
              </span>
            )}
            {current.badgeType === 'warning' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-mono font-bold bg-[#FBF4E6] text-[#8A6B2D] border border-[#E8DCB8]">
                {current.badge}
              </span>
            )}
            {current.badgeType === 'custom' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-mono font-bold bg-[#E6F4FB] text-[#2D6B8A] border border-[#BCE2F5]">
                {current.badge}
              </span>
            )}
            {current.badgeType === 'neutral' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-mono font-bold bg-[#F6F3EC] text-[#626760] border border-[#EAE5DC]">
                {current.badge}
              </span>
            )}
          </div>
        </div>

        <p className="text-[15px] sm:text-[16px] text-[#171A18] leading-relaxed">
          {current.verdictBody}
        </p>

        <div className="p-4 rounded-xl bg-[#F6F3EC] border border-[#EAE5DC] space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#345447] font-bold block">
            Shelv Guidance:
          </span>
          <p className="text-[14px] text-[#171A18] font-medium leading-relaxed">
            {current.advice}
          </p>
        </div>
      </div>
    </section>
  );
}
