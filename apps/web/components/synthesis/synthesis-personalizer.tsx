'use client';

import React, { useState } from 'react';
import type { EphemeralProfile } from '@/lib/derive-intelligence';

interface SynthesisPersonalizerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (profile: EphemeralProfile) => void;
  initialProfile?: EphemeralProfile | null;
}

export function SynthesisPersonalizer({
  isOpen,
  onClose,
  onSubmit,
  initialProfile,
}: SynthesisPersonalizerProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    initialProfile?.goals || ['texture']
  );
  const [reactivity, setReactivity] = useState<EphemeralProfile['reactivity']>(
    initialProfile?.reactivity || 'reacts_easily'
  );
  const [treatments, setTreatments] = useState<Array<EphemeralProfile['currentTreatments'][number]>>(
    initialProfile?.currentTreatments || ['topical_retinoid']
  );

  if (!isOpen) return null;

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const toggleTreatment = (id: EphemeralProfile['currentTreatments'][number]) => {
    if (id === 'none') {
      setTreatments(['none']);
      return;
    }
    setTreatments((prev) => {
      const withoutNone = prev.filter((t) => t !== 'none');
      return withoutNone.includes(id)
        ? withoutNone.filter((t) => t !== id)
        : [...withoutNone, id];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      goals: selectedGoals.length ? selectedGoals : ['texture'],
      reactivity,
      currentTreatments: treatments.length ? treatments : ['none'],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#171A18]/45 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#FFFEFB] w-full max-w-md rounded-t-3xl sm:rounded-2xl border-t sm:border border-[#EAE5DC] shadow-2xl p-5 pb-8 sm:p-6 animate-in slide-in-from-bottom-8 duration-250 font-sans">
        {/* iOS-Style Sheet Grabber Bar */}
        <div className="w-10 h-1 bg-[#626760]/25 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EAE5DC]">
          <div>
            <h3 className="text-base font-bold text-[#171A18]">
              Your Skin Context
            </h3>
            <p className="text-[12px] text-[#626760]">
              Takes 15 seconds. Changes the verdict deterministically.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] font-medium text-[#626760] hover:text-[#171A18] transition-colors"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-[13px]">
          {/* Question 1: Reactivity */}
          <div className="space-y-1.5">
            <span className="font-semibold text-[#171A18] block text-[12px]">
              1. Skin Sensitivity
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setReactivity('reacts_easily')}
                className={`p-2.5 rounded-xl text-left text-[12px] border transition-all ${
                  reactivity === 'reacts_easily'
                    ? 'bg-[#E2EAE4] border-[#345447] text-[#171A18] font-medium'
                    : 'bg-[#FFFEFB] border-[#EAE5DC] text-[#626760] hover:border-[#345447]/30'
                }`}
              >
                Reacts easily (Stings/Flushes)
              </button>
              <button
                type="button"
                onClick={() => setReactivity('generally_tolerates')}
                className={`p-2.5 rounded-xl text-left text-[12px] border transition-all ${
                  reactivity === 'generally_tolerates'
                    ? 'bg-[#E2EAE4] border-[#345447] text-[#171A18] font-medium'
                    : 'bg-[#FFFEFB] border-[#EAE5DC] text-[#626760] hover:border-[#345447]/30'
                }`}
              >
                Generally tolerates well
              </button>
            </div>
          </div>

          {/* Question 2: Actives in use */}
          <div className="space-y-1.5">
            <span className="font-semibold text-[#171A18] block text-[12px]">
              2. Ongoing Active Treatments
            </span>
            <div className="space-y-1">
              {[
                { id: 'topical_retinoid', label: 'Retinoid (Tretinoin, Retinol, Adapalene)' },
                { id: 'exfoliating_acid', label: 'Exfoliating Acid (AHA, BHA, Glycolic)' },
                { id: 'benzoyl_peroxide', label: 'Benzoyl Peroxide' },
                { id: 'none', label: 'None of these' },
              ].map((t) => {
                const active = treatments.includes(t.id as any);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTreatment(t.id as any)}
                    className={`w-full p-2.5 rounded-xl text-left text-[12px] flex items-center justify-between border transition-all ${
                      active
                        ? 'bg-[#E2EAE4]/60 border-[#345447] text-[#171A18] font-medium'
                        : 'bg-[#FFFEFB] border-[#EAE5DC] text-[#626760] hover:border-[#345447]/30'
                    }`}
                  >
                    <span>{t.label}</span>
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                        active ? 'bg-[#345447] text-[#FFFEFB]' : 'border border-[#EAE5DC]'
                      }`}
                    >
                      {active ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 3: Primary Concern */}
          <div className="space-y-1.5">
            <span className="font-semibold text-[#171A18] block text-[12px]">
              3. Primary Skin Focus
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'texture', label: 'Texture & Pores' },
                { id: 'breakouts', label: 'Breakouts' },
                { id: 'redness', label: 'Redness' },
                { id: 'dryness', label: 'Dryness' },
              ].map((g) => {
                const active = selectedGoals.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGoal(g.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                      active
                        ? 'bg-[#345447] text-[#FFFEFB] border-[#345447]'
                        : 'bg-[#FFFEFB] border-[#EAE5DC] text-[#626760] hover:border-[#345447]/40'
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#345447] hover:bg-[#284237] text-[#FFFEFB] text-[13px] font-medium py-3 rounded-xl transition-all active:scale-[0.98]"
            >
              Update Verdict →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
