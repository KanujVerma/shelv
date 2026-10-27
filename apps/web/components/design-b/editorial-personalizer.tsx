'use client';

import React, { useState } from 'react';
import type { EphemeralProfile } from '@/lib/derive-intelligence';

interface EditorialPersonalizerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (profile: EphemeralProfile) => void;
  initialProfile?: EphemeralProfile | null;
}

export function EditorialPersonalizer({
  isOpen,
  onClose,
  onSubmit,
  initialProfile,
}: EditorialPersonalizerProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171A18]/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFFEFB] w-full max-w-lg rounded-xl border border-[#EAE5DC] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-[#EAE5DC] flex items-baseline justify-between">
          <div>
            <span className="text-[11px] font-sans font-semibold uppercase tracking-widest text-[#626760] block mb-1">
              Context Evaluation
            </span>
            <h3 className="text-xl font-serif font-normal text-[#171A18]">
              Refine for Your Skin
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] font-sans text-[#626760] hover:text-[#171A18] transition-colors"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto font-sans">
          {/* Reactivity */}
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-[#171A18] block">
              1. Skin Barrier Tolerance
            </label>
            <div className="space-y-1.5">
              {[
                { id: 'reacts_easily', label: 'Reactive / Flushes or stings readily' },
                { id: 'generally_tolerates', label: 'Resilient / Tolerates most formulations' },
                { id: 'unsure', label: 'Variable or uncertain' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setReactivity(opt.id as any)}
                  className={`w-full p-3 rounded-lg text-left text-[13px] border transition-all ${
                    reactivity === opt.id
                      ? 'bg-[#F6F3EC] border-[#171A18] text-[#171A18] font-medium'
                      : 'bg-[#FFFEFB] border-[#EAE5DC] text-[#626760] hover:border-[#171A18]/30'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Treatments */}
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-[#171A18] block">
              2. Ongoing Active Treatments
            </label>
            <div className="space-y-1.5">
              {[
                { id: 'topical_retinoid', label: 'Topical Retinoid (Retinol, Tretinoin, Adapalene)' },
                { id: 'benzoyl_peroxide', label: 'Benzoyl Peroxide' },
                { id: 'exfoliating_acid', label: 'Direct Exfoliating Acid (AHA, BHA, Glycolic)' },
                { id: 'none', label: 'None of the above' },
              ].map((t) => {
                const active = treatments.includes(t.id as any);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTreatment(t.id as any)}
                    className={`w-full p-3 rounded-lg text-left text-[13px] flex items-center justify-between border transition-all ${
                      active
                        ? 'bg-[#F6F3EC] border-[#171A18] text-[#171A18] font-medium'
                        : 'bg-[#FFFEFB] border-[#EAE5DC] text-[#626760] hover:border-[#171A18]/30'
                    }`}
                  >
                    <span>{t.label}</span>
                    <span className="text-xs">{active ? '●' : '○'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#EAE5DC] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-[13px] text-[#626760] hover:text-[#171A18]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#171A18] hover:bg-[#345447] text-[#FFFEFB] px-5 py-2.5 rounded-lg text-[13px] font-medium transition-all"
            >
              Apply Context →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
