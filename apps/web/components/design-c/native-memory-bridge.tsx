'use client';

import React from 'react';

export function NativeMemoryBridge() {
  return (
    <div className="p-5 rounded-2xl bg-[#FFFEFB] border border-[#EAE5DC] shadow-sm font-sans space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[14px] font-bold text-[#171A18]">
          Shelv remembers this in the app.
        </h4>
        <span className="text-[10px] font-bold bg-[#E2EAE4] text-[#345447] px-2 py-0.5 rounded-full uppercase">
          iOS Only
        </span>
      </div>

      <p className="text-[13px] text-[#626760] leading-relaxed">
        Save this formula to your shelf, track irritation over time, and scan barcodes offline. Your skin data is encrypted privately on your device.
      </p>

      <a
        href="https://derive-beta-site.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full bg-[#171A18] hover:bg-[#345447] text-[#FFFEFB] text-[13px] font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
      >
        <span>Open in Shelv iOS App</span>
        <span>→</span>
      </a>
    </div>
  );
}
