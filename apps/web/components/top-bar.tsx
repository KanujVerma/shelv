'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface TopBarProps {
  onCheckClick?: () => void;
}

export function TopBar({ onCheckClick }: TopBarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-8 pt-3 sm:pt-4 pb-2 transition-all duration-300 w-full max-w-full">
      <div className="max-w-6xl mx-auto w-full">
        <div
          className={`liquid-glass-bar flex items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-full transition-all duration-300 ${
            scrolled ? 'shadow-md border-[#DDD6C9]' : 'shadow-sm border-[#EAE5DC]'
          }`}
        >
          {/* Brand Wordmark */}
          <Link href="/" className="flex items-center gap-2 group outline-none">
            <span
              className="text-lg font-serif font-bold tracking-[0.2em] text-[#171A18] uppercase group-hover:text-[#345447] transition-colors"
            >
              <img src="/brand/shelv-transparent.svg" width="32" height="32" alt="" aria-hidden="true" className="inline-block shrink-0 align-middle" /> Shelv
            </span>
            <span className="hidden sm:inline-block text-[11px] font-sans font-medium tracking-wider text-[#626760] bg-[#E2EAE4] text-[#345447] px-2 py-0.5 rounded-full">
              Free Check
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-[14px] font-medium text-[#626760]">
            <a href="#how-it-works" className="hover:text-[#171A18] transition-colors">
              How it works
            </a>
            <a href="#differentiation" className="hover:text-[#171A18] transition-colors">
              Not a score
            </a>
            <Link href="/managed" className="hover:text-[#171A18] transition-colors">
              Managed Skincare
            </Link>
            <a href="#trust" className="hover:text-[#171A18] transition-colors">
              Trust
            </a>
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onCheckClick) {
                  onCheckClick();
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="bg-[#345447] hover:bg-[#284237] text-[#FFFEFB] text-[12px] sm:text-[13px] font-medium px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all shadow-sm active:scale-95 whitespace-nowrap"
            >
              <span className="sm:hidden">Check</span>
              <span className="hidden sm:inline">Check a product</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
