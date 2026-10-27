'use client';

import React, { useState } from 'react';

interface BottomCheckSectionProps {
  onCheck: (url: string) => void;
}

export function BottomCheckSection({ onCheck }: BottomCheckSectionProps) {
  const [link, setLink] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!link.trim()) return;
    onCheck(link.trim());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-20 px-4 sm:px-8 max-w-3xl mx-auto text-center border-t border-[#EAE5DC]">
      <div className="space-y-4 mb-8">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#171A18]">
          Have a product you're thinking about buying?
        </h2>
        <p className="text-[15px] text-[#626760] max-w-lg mx-auto">
          Paste the link right now. Find out what it actually does before checkout.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="liquid-glass-input rounded-2xl p-2 sm:p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl mx-auto w-full"
      >
        <input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Paste a product link from any store..."
          className="flex-1 min-w-0 bg-transparent px-3 py-2 text-[14px] sm:text-[15px] text-[#171A18] placeholder-[#626760]/70 focus:outline-none min-h-[44px]"
        />
        <button
          type="submit"
          disabled={!link.trim()}
          className="bg-[#345447] hover:bg-[#284237] disabled:opacity-50 text-[#FFFEFB] text-[14px] font-medium px-6 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap min-h-[44px]"
        >
          Check product →
        </button>
      </form>
    </section>
  );
}
