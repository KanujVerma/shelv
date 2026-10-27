'use client';

import React from 'react';
import Link from 'next/link';

export function SynthesisFooter() {
  return (
    <footer className="mt-16 border-t border-[#EAE5DC] pt-8 pb-12 px-4 sm:px-6 max-w-2xl mx-auto font-sans text-[12px] text-[#626760] space-y-4">
      {/* Managed Care Line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#EAE5DC]">
        <span>Looking for 1-on-1 routine management?</span>
        <Link
          href="/managed"
          className="text-[#345447] hover:text-[#284237] underline underline-offset-2 font-medium transition-colors"
        >
          $25/mo Managed Skincare Beta →
        </Link>
      </div>

      {/* Trust & Canonical Legal Links */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px]">
        <span>Shelv · Independent Cosmetic Intelligence · Non-diagnostic</span>
        <div className="flex items-center gap-3">
          <a
            href="https://derive-beta-site.vercel.app/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#171A18] transition-colors"
          >
            Privacy
          </a>
          <span className="opacity-40">·</span>
          <a
            href="https://derive-beta-site.vercel.app/support"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#171A18] transition-colors"
          >
            Support
          </a>
          <span className="opacity-40">·</span>
          <a
            href="https://derive-beta-site.vercel.app/privacy-choices"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#171A18] transition-colors"
          >
            Privacy Choices
          </a>
        </div>
      </div>
    </footer>
  );
}
