import React from 'react';
import Link from 'next/link';
import { TopBar } from '@/components/top-bar';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'Privacy Policy — Shelv',
  description: 'Shelv Founding Beta privacy policy and data practices.',
};

export default function PrivacyPage() {
  return (
    <>
      <TopBar />

      <main className="flex-1 pt-32 pb-20 px-4 sm:px-8 max-w-3xl mx-auto space-y-8">
        <div>
          <span className="text-[12px] font-mono uppercase tracking-widest text-[#626760]">
            Shelv Founding Beta
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#171A18] mt-1">
            Privacy Policy
          </h1>
          <p className="text-[15px] text-[#626760] mt-3 leading-relaxed">
            This policy describes the Founding Beta of Shelv, a cosmetic skincare management app. Shelv does not diagnose medical conditions and is not a substitute for professional medical care.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-[#171A18]">
            Information you provide
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-[15px] text-[#171A18] leading-relaxed">
            <li>
              <strong>Account information:</strong> first name, last name, and email address, plus the password you choose. Shelv does not store that password itself; Supabase Auth handles it.
            </li>
            <li>
              <strong>Skincare context you enter:</strong> goals, preferences, current products, reactions, sensitivities, prescription context, pregnancy or nursing disclosure, notes, check-ins, and routine history.
            </li>
            <li>
              <strong>Photos you choose to add:</strong> baseline face or skin photos, product or shelf photos, and check-in photos when that capture is available.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-[#171A18]">
            Information used to operate the account
          </h2>
          <p className="text-[15px] text-[#171A18] leading-relaxed">
            Shelv keeps the account identifier and session needed to sign you in, keep your records private to you, and secure the service. This external beta does not send your information to an advertising network.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-[#171A18]">
            How information is used
          </h2>
          <p className="text-[15px] text-[#171A18] leading-relaxed">
            Shelv uses this information to provide the beta, maintain your account and access, store onboarding context, prepare and show your routine and progress, protect the account, and respond to support requests. Direct feedback may be used to improve reliability. AI-enabled Ask and Scan are not part of this external beta build. If Shelv later sends personal data to a model provider, this policy will be updated before that use is relied on for beta customers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-[#171A18]">
            Who processes it
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-[15px] text-[#171A18] leading-relaxed">
            <li>
              <strong>Supabase:</strong> provides authentication, the database, private file storage, and backend functions for the Shelv account. Customer photos and account records are stored there for the beta.
            </li>
            <li>
              <strong>Apple and TestFlight:</strong> distribute the beta app and may receive the beta feedback you submit through Apple.
            </li>
            <li>
              <strong>Vercel:</strong> hosts this public website. Visiting these pages does not send your skin photos or account records to Vercel.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-[#171A18]">
            Retention and deletion
          </h2>
          <p className="text-[15px] text-[#171A18] leading-relaxed">
            Information is kept while needed to provide your account and for legitimate security and operational needs. You can permanently delete your account inside Shelv from Founding Beta Access before activation, or from Account after access is active. That deletion removes your user-owned private files and account records through Shelv's deletion process. Limited technical logs or backups may remain for a short time where needed for security, reliability, or legal obligations. Deletion is not claimed to erase every backup instantly.
          </p>
          <p className="text-[14px] text-[#626760] pt-2">
            Questions about this policy or your information can go to{' '}
            <a href="mailto:kanuj.verma12@gmail.com" className="text-[#345447] underline">
              kanuj.verma12@gmail.com
            </a>
            .{' '}
            <Link href="/support" className="text-[#345447] underline ml-2">
              Support
            </Link>{' '}
            ·{' '}
            <Link href="/privacy-choices" className="text-[#345447] underline ml-2">
              Privacy choices
            </Link>
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
