'use client';

import React, { useState } from 'react';
import type { EphemeralProfile } from '@/lib/derive-intelligence';

interface NativeSheetPersonalizerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (profile: EphemeralProfile) => void;
  initialProfile?: EphemeralProfile | null;
}

export function NativeSheetPersonalizer({
  isOpen,
  onClose,
  onSubmit,
  initialProfile,
}: NativeSheetPersonalizerProps) {
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#171A18]/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFFEFB] w-full max-w-md rounded-t-2xl sm:rounded-2xl border-t sm:border border-[#EAE5DC] shadow-2xl p-5 pb-8 sm:p-6 animate-in slide-in-from-bottom-8 duration-250 font-sans">
        {/* iOS-Style Sheet Grabber */}
        <div className="w-10 h-1 bg-[#626760]/25 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#171A18]">
            Skin Context (15s)
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] font-medium text-[#626760] hover:text-[#171A18]"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-[13px]">
          {/* Reactivity */}
          <div className="space-y-1.5">
            <span className="font-semibold text-[#171A18] block text-[12px]">
              Skin Sensitivity
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setReactivity('reacts_easily')}
                className={`p-2.5 rounded-lg text-left text-[12px] border transition-all ${
                  reactivity === 'reacts_easily'
                    ? 'bg-[#E2EAE4] border-[#345447] text-[#171A18] font-medium'
                    : 'bg-[#FFFEFB] border-[#EAE5DC] text-[#626760]'
                }`}
              >
                Reacts easily
              </button>
              <button
                type="button"
                onClick={() => setReactivity('generally_tolerates')}
                className={`p-2.5 rounded-lg text-left text-[12px] border transition-all ${
                  reactivity === 'generally_tolerates'
                    ? 'bg-[#E2EAE4] border-[#345447] text-[#171A18] font-medium'
                    : 'bg-[#FFFEFB] border-[#EAE5DC] text-[#626760]'
                }`}
              >
                Generally tolerates
              </button>
            </div>
          </div>

          {/* Actives */}
          <div className="space-y-1.5">
            <span className="font-semibold text-[#171A18] block text-[12px]">
              Current Actives
            </span>
            <div className="space-y-1">
              {[
                { id: 'topical_retinoid', label: 'Retinoid / Tretinoin' },
                { id: 'exfoliating_acid', label: 'Exfoliating Acid (AHA/BHA)' },
                { id: 'none', label: 'None' },
              ].map((t) => {
                const active = treatments.includes(t.id as any);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTreatment(t.id as any)}
                    className={`w-full p-2.5 rounded-lg text-left text-[12px] flex items-center justify-between border transition-all ${
                      active
                        ? 'bg-[#E2EAE4] border-[#345447] text-[#171A18] font-medium'
                        : 'bg-[#FFFEFB] border-[#EAE5DC] text-[#626760]'
                    }`}
                  >
                    <span>{t.label}</span>
                    <span>{active ? '✓' : ''}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goals */}
          <div className="space-y-1.5">
            <span className="font-semibold text-[#171A18] block text-[12px]">
              Primary Concern
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'texture', label: 'Texture' },
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
                    className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${
                      active
                        ? 'bg-[#345447] text-[#FFFEFB] border-[#345447]'
                        : 'bg-[#FFFEFB] border-[#EAE5DC] text-[#626760]'
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#345447] hover:bg-[#284237] text-[#FFFEFB] text-[13px] font-medium py-2.5 rounded-xl transition-all"
            >
              Update Verdict
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
