'use client';

import React from 'react';
import Link from 'next/link';

export function EditorialFooter() {
  return (
    <footer className="mt-20 border-t border-[#EAE5DC] pt-12 pb-16 px-4 sm:px-8 max-w-5xl mx-auto font-sans">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
        <div className="md:col-span-6 space-y-2">
          <p className="font-serif text-lg text-[#171A18]">
            Shelv Skincare Intelligence
          </p>
          <p className="text-[13px] text-[#626760] leading-relaxed max-w-md">
            Built on dermatological evidence, not sponsored recommendations or universal health scores. Independent, conservative, and scanner-first.
          </p>
        </div>

        <div className="md:col-span-6 md:border-l md:border-[#EAE5DC] md:pl-8 space-y-2">
          <p className="text-[13px] font-semibold text-[#171A18]">
            Managed Skincare
          </p>
          <p className="text-[13px] text-[#626760] leading-relaxed">
            Need an unhurried, expert team to architect and adjust your daily skincare regimen?
          </p>
          <Link
            href="/managed"
            className="text-[13px] text-[#345447] hover:underline underline-offset-3 font-medium block pt-1"
          >
            Learn about $25/month Managed Care →
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[12px] text-[#626760] pt-6 border-t border-[#EAE5DC]">
        <span>© {new Date().getFullYear()} Shelv.</span>
        <div className="flex items-center gap-4">
          <a
            href="https://derive-beta-site.vercel.app/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#171A18] transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="https://derive-beta-site.vercel.app/support"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#171A18] transition-colors"
          >
            Support
          </a>
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
