'use client';

import React from 'react';
import Link from 'next/link';

export function MineralFooter() {
  return (
    <footer className="mt-20 border-t border-[#EAE5DC] pt-12 pb-16 px-4 sm:px-6 max-w-4xl mx-auto">
      {/* Compact Managed Skincare Bridge */}
      <div className="p-6 rounded-2xl bg-[#FFFEFB] border border-[#EAE5DC] mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[14px] font-sans font-semibold text-[#171A18]">
            Need a human to architect your skincare?
          </p>
          <p className="text-[13px] text-[#626760]">
            Shelv's dermatological team manages your routine end-to-end for $25/month.
          </p>
        </div>
        <Link
          href="/managed"
          className="text-[13px] font-sans font-medium text-[#345447] hover:text-[#284237] underline underline-offset-3 whitespace-nowrap shrink-0"
        >
          Managed Skincare Beta →
        </Link>
      </div>

      {/* Trust & Legal Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[12px] text-[#626760] font-sans">
        <div className="space-y-1">
          <p className="text-[#171A18] font-medium">Shelv Skincare Intelligence</p>
          <p className="text-[11px] text-[#626760]/80">
            Independent cosmetic formula analysis. Non-diagnostic. Not medical advice.
          </p>
        </div>

        {/* Canonical External Legal Links */}
        <div className="flex items-center gap-4">
          <a
            href="https://derive-beta-site.vercel.app/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#171A18] transition-colors"
          >
            Privacy
          </a>
          <span>·</span>
          <a
            href="https://derive-beta-site.vercel.app/support"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#171A18] transition-colors"
          >
            Support
          </a>
          <span>·</span>
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
