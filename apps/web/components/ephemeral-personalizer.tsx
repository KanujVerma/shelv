'use client';

import React, { useState } from 'react';
import type { EphemeralProfile } from '@/lib/derive-intelligence';

interface EphemeralPersonalizerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (profile: EphemeralProfile) => void;
  initialProfile?: EphemeralProfile | null;
}

const GOAL_OPTIONS = [
  { id: 'breakouts', label: 'Breakouts', desc: 'Blemishes & clogged pores' },
  { id: 'dark_spots', label: 'Dark spots', desc: 'Post-acne marks & tone' },
  { id: 'dryness', label: 'Dryness & barrier', desc: 'Flaking, tightness & dehydration' },
  { id: 'oiliness', label: 'Excess oil', desc: 'Midday shine & congestion' },
  { id: 'texture', label: 'Texture', desc: 'Roughness & small bumps' },
  { id: 'redness', label: 'Redness', desc: 'Flushing & reactive skin' },
  { id: 'fine_lines', label: 'Fine lines', desc: 'Early lines & skin elasticity' },
];

const REACTIVITY_OPTIONS: Array<{ id: EphemeralProfile['reactivity']; label: string; desc: string }> = [
  { id: 'reacts_easily', label: 'Reacts easily', desc: 'Prone to stinging, redness, or barrier flare-ups' },
  { id: 'generally_tolerates', label: 'Usually tolerates products', desc: 'Rarely experiences irritation or breakouts' },
  { id: 'unsure', label: 'Not sure', desc: 'Variable or untested' },
];

const TREATMENT_OPTIONS = [
  { id: 'topical_retinoid', label: 'Retinoid / Tretinoin / Adapalene' },
  { id: 'benzoyl_peroxide', label: 'Benzoyl Peroxide' },
  { id: 'exfoliating_acid', label: 'Exfoliating Acids (AHA / BHA)' },
  { id: 'other_prescription', label: 'Other Prescription Topical' },
  { id: 'none', label: 'None / Not sure' },
];

export function EphemeralPersonalizer({
  isOpen,
  onClose,
  onSubmit,
  initialProfile,
}: EphemeralPersonalizerProps) {
  const [goals, setGoals] = useState<string[]>(initialProfile?.goals || ['breakouts']);
  const [reactivity, setReactivity] = useState<EphemeralProfile['reactivity']>(
    initialProfile?.reactivity || 'reacts_easily'
  );
  const [treatments, setTreatments] = useState<Array<EphemeralProfile['currentTreatments'][number]>>(
    initialProfile?.currentTreatments || ['topical_retinoid']
  );

  if (!isOpen) return null;

  const toggleGoal = (id: string) => {
    if (goals.includes(id)) {
      setGoals(goals.filter((g) => g !== id));
    } else {
      if (goals.length < 3) {
        setGoals([...goals, id]);
      }
    }
  };

  const toggleTreatment = (id: EphemeralProfile['currentTreatments'][number]) => {
    if (id === 'none') {
      setTreatments(['none']);
      return;
    }
    const filtered = treatments.filter((t) => t !== 'none');
    if (filtered.includes(id)) {
      const next = filtered.filter((t) => t !== id);
      setTreatments(next.length === 0 ? ['none'] : next);
    } else {
      setTreatments([...filtered, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      goals: goals.length > 0 ? goals : ['breakouts'],
      reactivity,
      currentTreatments: treatments.length > 0 ? treatments : ['none'],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171A18]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="mineral-card w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EAE5DC]">
          <div>
            <h2 id="modal-title" className="text-xl sm:text-2xl font-serif font-bold text-[#171A18]">
              Personalize this result
            </h2>
            <p className="text-[14px] text-[#626760] mt-1">
              Give Shelv ~15 seconds of context. No account required.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#626760] hover:text-[#171A18] hover:bg-[#EAE5DC]/60 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question 1: Goals */}
          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <label className="text-[14px] font-semibold text-[#171A18]">
                1. What are you trying to improve?
              </label>
              <span className="text-[12px] font-mono text-[#626760]">
                Choose up to 3
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {GOAL_OPTIONS.map((goal) => {
                const isSelected = goals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleGoal(goal.id)}
                    className={`text-left p-3 rounded-xl border transition-all min-h-[48px] ${
                      isSelected
                        ? 'border-[#345447] bg-[#E2EAE4] text-[#171A18]'
                        : 'border-[#EAE5DC] bg-[#FFFEFB] hover:border-[#DDD6C9] text-[#171A18]'
                    }`}
                  >
                    <div className="text-[13px] font-medium leading-tight">
                      {goal.label}
                    </div>
                    <div className="text-[11px] text-[#626760] mt-0.5">
                      {goal.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 2: Reactivity */}
          <div className="space-y-2.5">
            <label className="text-[14px] font-semibold text-[#171A18] block">
              2. How does your skin handle new products?
            </label>
            <div className="grid grid-cols-1 gap-2">
              {REACTIVITY_OPTIONS.map((opt) => {
                const isSelected = reactivity === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setReactivity(opt.id)}
                    className={`text-left p-3 rounded-xl border transition-all min-h-[44px] flex items-center justify-between ${
                      isSelected
                        ? 'border-[#345447] bg-[#E2EAE4] text-[#171A18]'
                        : 'border-[#EAE5DC] bg-[#FFFEFB] hover:border-[#DDD6C9] text-[#171A18]'
                    }`}
                  >
                    <div>
                      <div className="text-[13px] font-medium leading-tight">{opt.label}</div>
                      <div className="text-[11px] text-[#626760]">{opt.desc}</div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                        isSelected ? 'border-[#345447] bg-[#345447]' : 'border-[#DDD6C9]'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#FFFEFB]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 3: Current Strong Actives */}
          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <label className="text-[14px] font-semibold text-[#171A18]">
                3. Are you using any active treatments right now?
              </label>
              <span className="text-[12px] font-mono text-[#626760]">
                Select all that apply
              </span>
            </div>
            <div className="space-y-1.5">
              {TREATMENT_OPTIONS.map((t) => {
                const isSelected = treatments.includes(t.id as any);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTreatment(t.id as any)}
                    className={`w-full text-left p-2.5 px-3 rounded-xl border transition-all min-h-[44px] flex items-center justify-between ${
                      isSelected
                        ? 'border-[#345447] bg-[#E2EAE4] text-[#171A18]'
                        : 'border-[#EAE5DC] bg-[#FFFEFB] hover:border-[#DDD6C9] text-[#171A18]'
                    }`}
                  >
                    <span className="text-[13px] font-medium">{t.label}</span>
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center text-[11px] ${
                        isSelected
                          ? 'border-[#345447] bg-[#345447] text-[#FFFEFB]'
                          : 'border-[#DDD6C9] text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-[#EAE5DC] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-[14px] font-medium text-[#626760] hover:text-[#171A18] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#345447] hover:bg-[#284237] text-[#FFFEFB] text-[14px] font-medium px-6 py-2.5 rounded-full transition-all shadow-sm active:scale-95 flex items-center gap-2"
            >
              <span>Apply context</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
