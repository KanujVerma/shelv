import React from 'react';
import Link from 'next/link';
import { TopBar } from '@/components/top-bar';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'Privacy Choices — Shelv',
  description: 'Your privacy choices and account deletion instructions for Shelv.',
};

export default function PrivacyChoicesPage() {
  return (
    <>
      <TopBar />

      <main className="flex-1 pt-32 pb-20 px-4 sm:px-8 max-w-3xl mx-auto space-y-8">
        <div>
          <span className="text-[12px] font-mono uppercase tracking-widest text-[#626760]">
            Shelv Founding Beta
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#171A18] mt-1">
            Privacy choices
          </h1>
          <p className="text-[15px] text-[#626760] mt-3 leading-relaxed">
            You can delete your Shelv account in the app. You do not need to email support first.
          </p>
        </div>

        <section className="mineral-card rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-serif font-bold text-[#171A18]">
            In-App Account Deletion
          </h2>
          <div className="space-y-3 text-[15px] text-[#171A18] leading-relaxed">
            <p>
              <strong>Before beta access is active:</strong> open Founding Beta Access and choose Delete Account.
            </p>
            <p>
              <strong>After access is active:</strong> open Account and choose Delete Account.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-[#171A18]">
            Questions & Inquiries
          </h2>
          <p className="text-[15px] text-[#171A18] leading-relaxed">
            Questions about privacy can also go to{' '}
            <a href="mailto:kanuj.verma12@gmail.com" className="text-[#345447] underline">
              kanuj.verma12@gmail.com
            </a>
            . Please avoid including unnecessary sensitive medical information in email.
          </p>
          <div className="pt-2 text-[14px] text-[#626760]">
            <Link href="/support" className="text-[#345447] underline">
              Support
            </Link>{' '}
            ·{' '}
            <Link href="/privacy" className="text-[#345447] underline ml-2">
              Privacy Policy
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
