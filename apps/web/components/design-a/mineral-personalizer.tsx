'use client';

import React, { useState } from 'react';
import type { EphemeralProfile } from '@/lib/derive-intelligence';

interface MineralPersonalizerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (profile: EphemeralProfile) => void;
  initialProfile?: EphemeralProfile | null;
}

const GOALS = [
  { id: 'texture', label: 'Clogged pores & texture' },
  { id: 'breakouts', label: 'Active breakouts' },
  { id: 'redness', label: 'Redness & barrier irritation' },
  { id: 'dark_spots', label: 'Dark spots & post-acne marks' },
  { id: 'dryness', label: 'Dryness & flaking' },
  { id: 'fine_lines', label: 'Fine lines & premature aging' },
];

const TREATMENTS = [
  { id: 'topical_retinoid', label: 'Retinoid (Tretinoin, Retinol, Adapalene)' },
  { id: 'benzoyl_peroxide', label: 'Benzoyl Peroxide' },
  { id: 'exfoliating_acid', label: 'Exfoliating Acid (AHA, Glycolic, Lactic)' },
  { id: 'none', label: 'None of these' },
];

export function MineralPersonalizer({
  isOpen,
  onClose,
  onSubmit,
  initialProfile,
}: MineralPersonalizerProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171A18]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FFFEFB] w-full max-w-lg rounded-2xl border border-[#EAE5DC] shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#EAE5DC] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-sans font-semibold text-[#171A18]">
              Your Skin Context
            </h3>
            <p className="text-[13px] text-[#626760]">
              Takes 15 seconds. Changes the answer deterministically.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#626760] hover:text-[#171A18] hover:bg-[#F6F3EC] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Question 1: Reactivity */}
          <div className="space-y-2">
            <label className="text-[13px] font-sans font-semibold text-[#171A18] block">
              1. How does your skin react to new products?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'reacts_easily', label: 'Reacts easily (Sensitive/Stinging)' },
                { id: 'generally_tolerates', label: 'Generally tolerates well' },
                { id: 'unsure', label: 'Not sure' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setReactivity(opt.id as any)}
                  className={`p-3 rounded-xl text-left text-[12px] font-sans transition-all border ${
                    reactivity === opt.id
                      ? 'bg-[#E2EAE4] border-[#345447] text-[#171A18] font-medium'
                      : 'bg-[#FFFEFB] border-[#EAE5DC] text-[#626760] hover:border-[#345447]/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question 2: Actives in use */}
          <div className="space-y-2">
            <label className="text-[13px] font-sans font-semibold text-[#171A18] block">
              2. Do you currently use any of these active treatments?
            </label>
            <div className="space-y-1.5">
              {TREATMENTS.map((treatment) => {
                const checked = treatments.includes(treatment.id as any);
                return (
                  <button
                    key={treatment.id}
                    type="button"
                    onClick={() => toggleTreatment(treatment.id as any)}
                    className={`w-full p-3 rounded-xl text-left text-[13px] font-sans flex items-center justify-between transition-all border ${
                      checked
                        ? 'bg-[#E2EAE4]/60 border-[#345447] text-[#171A18] font-medium'
                        : 'bg-[#FFFEFB] border-[#EAE5DC] text-[#626760] hover:border-[#345447]/40'
                    }`}
                  >
                    <span>{treatment.label}</span>
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                        checked ? 'bg-[#345447] text-[#FFFEFB]' : 'border border-[#EAE5DC]'
                      }`}
                    >
                      {checked ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 3: Primary Goals */}
          <div className="space-y-2">
            <label className="text-[13px] font-sans font-semibold text-[#171A18] block">
              3. What are you primarily trying to address?
            </label>
            <div className="flex flex-wrap gap-1.5">
              {GOALS.map((goal) => {
                const active = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleGoal(goal.id)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-sans transition-all border ${
                      active
                        ? 'bg-[#345447] text-[#FFFEFB] border-[#345447]'
                        : 'bg-[#FFFEFB] border-[#EAE5DC] text-[#626760] hover:border-[#345447]/40'
                    }`}
                  >
                    {goal.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#EAE5DC] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[13px] font-sans font-medium text-[#626760] hover:text-[#171A18]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#345447] hover:bg-[#284237] text-[#FFFEFB] px-5 py-2.5 rounded-xl text-[13px] font-sans font-medium transition-all active:scale-[0.98]"
            >
              Update Decision
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
