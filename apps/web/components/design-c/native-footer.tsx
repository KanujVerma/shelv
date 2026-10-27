'use client';

import React from 'react';
import Link from 'next/link';

export function NativeFooter() {
  return (
    <footer className="mt-16 border-t border-[#EAE5DC] pt-8 pb-12 px-4 sm:px-6 max-w-2xl mx-auto font-sans text-[12px] text-[#626760] space-y-4">
      {/* Managed Care Line */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EAE5DC]">
        <span>Looking for 1-on-1 routine management?</span>
        <Link
          href="/managed"
          className="text-[#345447] hover:underline font-medium"
        >
          $25/mo Managed Beta →
        </Link>
      </div>

      {/* Trust & Legal */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
        <span>Shelv · Independent Cosmetic Intelligence</span>
        <div className="flex items-center gap-3">
          <a
            href="https://derive-beta-site.vercel.app/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#171A18]"
          >
            Privacy
          </a>
          <span>·</span>
          <a
            href="https://derive-beta-site.vercel.app/support"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#171A18]"
          >
            Support
          </a>
          <span>·</span>
          <a
            href="https://derive-beta-site.vercel.app/privacy-choices"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#171A18]"
          >
            Privacy Choices
          </a>
        </div>
      </div>
    </footer>
  );
}
