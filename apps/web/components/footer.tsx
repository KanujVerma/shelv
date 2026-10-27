'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[#EAE5DC] bg-[#FFFEFB] py-12 px-4 sm:px-8 text-[13px] text-[#626760]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-2 max-w-md">
          <span className="font-serif font-bold tracking-widest text-[#171A18] text-base uppercase">
            Shelv
          </span>
          <p className="text-[12px] leading-relaxed text-[#626760]">
            Shelv is a cosmetic skincare intelligence service. It does not diagnose medical conditions, prescribe pharmaceutical drugs, or provide clinical dermatological advice.
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-6 font-medium">
          <Link href="/privacy" className="hover:text-[#171A18] transition-colors">
            Privacy Policy
          </Link>
          <Link href="/support" className="hover:text-[#171A18] transition-colors">
            Support
          </Link>
          <Link href="/privacy-choices" className="hover:text-[#171A18] transition-colors">
            Privacy Choices
          </Link>
          <Link href="/managed" className="hover:text-[#171A18] transition-colors">
            Managed Skincare
          </Link>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-[#EAE5DC]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-[#626760]/80 text-center sm:text-left">
        <span>© {new Date().getFullYear()} Shelv. Direction A (Mineral).</span>
        <span className="break-words">No ad-tracking pixels · Zero sponsored product rankings</span>
      </div>
    </footer>
  );
}
