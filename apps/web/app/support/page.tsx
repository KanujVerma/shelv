import React from 'react';
import Link from 'next/link';
import { TopBar } from '@/components/top-bar';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'Support — Shelv',
  description: 'Support and contact details for Shelv beta members.',
};

export default function SupportPage() {
  return (
    <>
      <TopBar />

      <main className="flex-1 pt-32 pb-20 px-4 sm:px-8 max-w-3xl mx-auto space-y-8">
        <div>
          <span className="text-[12px] font-mono uppercase tracking-widest text-[#626760]">
            Shelv Founding Beta
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#171A18] mt-1">
            Support
          </h1>
          <p className="text-[15px] text-[#626760] mt-3 leading-relaxed">
            Shelv is a managed cosmetic skincare beta from Kanuj Verma. Support covers beta access, account issues, privacy questions, and product feedback.
          </p>
        </div>

        <section className="mineral-card rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-serif font-bold text-[#171A18]">
            Direct Founder Contact
          </h2>
          <p className="text-[15px] text-[#171A18] leading-relaxed">
            For beta support, account issues, privacy questions, or feedback, contact:
          </p>
          <div className="p-3 bg-[#F6F3EC] rounded-xl font-mono text-[14px] text-[#345447]">
            <a href="mailto:kanuj.verma12@gmail.com" className="hover:underline">
              kanuj.verma12@gmail.com
            </a>
          </div>
          <p className="text-[13px] text-[#626760] italic">
            Please avoid including unnecessary sensitive medical information in support email.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-[#171A18]">
            Account Deletion
          </h2>
          <p className="text-[15px] text-[#171A18] leading-relaxed">
            To delete your account, use <strong>Delete Account</strong> in the Shelv app. You do not need to email first.
          </p>
          <div className="pt-2 text-[14px] text-[#626760]">
            <Link href="/privacy" className="text-[#345447] underline">
              Privacy Policy
            </Link>{' '}
            ·{' '}
            <Link href="/privacy-choices" className="text-[#345447] underline ml-2">
              Privacy choices
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
