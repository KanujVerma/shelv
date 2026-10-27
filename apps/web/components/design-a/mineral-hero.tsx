'use client';

import React, { useState, useEffect } from 'react';
import { SAMPLE_PRODUCTS, type SampleProductItem } from '@/lib/sample-products';
import type { WebQuickRead, WebPersonalFitPreview, EphemeralProfile, ProductIdentity } from '@/lib/derive-intelligence';
import { trackEvent } from '@/lib/analytics';
import { MineralResult } from './mineral-result';
import { MineralPersonalizer } from './mineral-personalizer';
import { MineralAppBridge } from './mineral-app-bridge';

interface MineralHeroProps {
  initialCheck?: string;
  initialProfile?: EphemeralProfile;
}

export function MineralHero({ initialCheck, initialProfile }: MineralHeroProps) {
  const [inputValue, setInputValue] = useState(initialCheck || '');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [quickRead, setQuickRead] = useState<WebQuickRead | null>(null);
  const [product, setProduct] = useState<ProductIdentity | null>(null);
  const [personalVerdict, setPersonalVerdict] = useState<WebPersonalFitPreview | null>(null);
  const [currentProfile, setCurrentProfile] = useState<EphemeralProfile | null>(initialProfile || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const checkParam = params.get('check');
      const reactivity = params.get('reactivity') as EphemeralProfile['reactivity'] | null;
      const goalsParam = params.get('goals');
      const treatmentsParam = params.get('treatments');

      let profile: EphemeralProfile | undefined = undefined;
      if (reactivity || goalsParam || treatmentsParam) {
        profile = {
          reactivity: reactivity || 'generally_tolerates',
          goals: goalsParam ? goalsParam.split(',') : ['texture'],
          currentTreatments: treatmentsParam
            ? (treatmentsParam.split(',') as EphemeralProfile['currentTreatments'])
            : ['none'],
        };
        setCurrentProfile(profile);
      }

      if (checkParam) {
        setInputValue(checkParam);
        runAnalysis(checkParam, profile);
      }
    }
  }, []);

  const runAnalysis = async (queryOrUrl: string, profileOverride?: EphemeralProfile) => {
    const trimmed = queryOrUrl.trim();
    if (!trimmed) return;

    setLoading(true);
    setErrorMessage(null);
    setQuickRead(null);
    setPersonalVerdict(null);
    trackEvent('web_check_started');

    try {
      setLoadingStep('Reading formula & packaging...');
      await new Promise((r) => setTimeout(r, 400));

      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: trimmed.startsWith('http') ? trimmed : undefined,
          query: !trimmed.startsWith('http') ? trimmed : undefined,
          ephemeralProfile: profileOverride || currentProfile || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Could not verify product from that link.');
        return;
      }

      setProduct(data.product);
      setQuickRead(data.quickRead);
      if (data.personalFit) {
        setPersonalVerdict(data.personalFit);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Network error while checking this product. Please try again.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runAnalysis(inputValue);
  };

  const handleSampleClick = (sample: SampleProductItem) => {
    setInputValue(sample.url);
    runAnalysis(sample.url);
  };

  const handlePersonalizationSubmit = async (profile: EphemeralProfile) => {
    setCurrentProfile(profile);
    setIsModalOpen(false);

    if (product) {
      setLoading(true);
      setLoadingStep('Evaluating decision against your barrier & routine...');

      try {
        const res = await fetch('/api/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: product.sourceUrl || undefined,
            query: !product.sourceUrl ? `${product.brand} ${product.name}` : undefined,
            ephemeralProfile: profile,
          }),
        });
        const data = await res.json();
        if (data.success && data.personalFit) {
          setPersonalVerdict(data.personalFit);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingStep('');
      }
    }
  };

  return (
    <section className="pt-24 sm:pt-32 pb-16 px-4 sm:px-6 max-w-3xl mx-auto">
      {/* Restrained System Sans Hero */}
      <div className="text-center space-y-2.5 mb-8">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-sans font-semibold tracking-tight text-[#171A18] leading-[1.15] break-words">
          Should you use this on your face?
        </h1>
        <p className="text-[14px] sm:text-[16px] text-[#626760] font-sans">
          Paste any skincare product link to see what the formula actually does.
        </p>
      </div>

      {/* Floating Apple-Grade Liquid Glass Composer */}
      <div className="relative max-w-2xl mx-auto w-full">
        <form
          onSubmit={handleFormSubmit}
          className="rounded-2xl p-2 sm:p-2.5 bg-[#FFFEFB]/85 backdrop-blur-xl border border-[#EAE5DC] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2 transition-all hover:border-[#345447]/30 focus-within:border-[#345447]/60 focus-within:shadow-md w-full"
        >
          <div className="flex-1 min-w-0 flex items-center px-3 min-h-[44px]">
            <svg
              className="w-4 h-4 text-[#626760] shrink-0 mr-2.5 opacity-70"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Paste a Sephora, Ulta, or skincare link..."
              className="w-full min-w-0 bg-transparent text-[14px] sm:text-[15px] text-[#171A18] placeholder-[#626760]/60 focus:outline-none font-sans"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="bg-[#345447] hover:bg-[#284237] disabled:opacity-40 disabled:cursor-not-allowed text-[#FFFEFB] text-[13px] font-sans font-medium px-5 py-2.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[42px]"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-[#FFFEFB]/40 border-t-[#FFFEFB] rounded-full animate-spin" />
                <span>Checking...</span>
              </span>
            ) : (
              <span>Check</span>
            )}
          </button>
        </form>

        {/* Quiet Example Affordance */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[12px] text-[#626760] font-sans px-2">
          <span className="opacity-80">Or try:</span>
          <button
            type="button"
            onClick={() => handleSampleClick(SAMPLE_PRODUCTS[0])}
            className="text-[#171A18] hover:text-[#345447] underline underline-offset-3 transition-colors cursor-pointer"
          >
            Paula's Choice 2% BHA
          </button>
          <span className="opacity-40">·</span>
          <button
            type="button"
            onClick={() => handleSampleClick(SAMPLE_PRODUCTS[1])}
            className="text-[#171A18] hover:text-[#345447] underline underline-offset-3 transition-colors cursor-pointer"
          >
            The Ordinary Niacinamide
          </button>
        </div>
      </div>

      {/* Loading Feedback */}
      {loading && (
        <div className="mt-8 text-center space-y-2 py-8 animate-in fade-in duration-300">
          <div className="w-6 h-6 border-2 border-[#345447]/20 border-t-[#345447] rounded-full animate-spin mx-auto" />
          <p className="text-[13px] text-[#626760] font-sans font-medium">
            {loadingStep}
          </p>
        </div>
      )}

      {/* Error Feedback */}
      {errorMessage && !loading && (
        <div className="mt-8 p-4 rounded-xl bg-[#FBF4E6] border border-[#E8DCB8] text-[13px] text-[#8A6B2D] space-y-2">
          <p className="font-medium">Could not retrieve complete product data</p>
          <p className="text-[#171A18]">{errorMessage}</p>
        </div>
      )}

      {/* Results Container */}
      {(quickRead || personalVerdict) && !loading && (
        <div className="mt-8 space-y-6">
          <MineralResult
            quickRead={quickRead}
            personalVerdict={personalVerdict}
            product={product}
            onOpenPersonalizer={() => setIsModalOpen(true)}
          />

          {personalVerdict && <MineralAppBridge />}
        </div>
      )}

      {/* Ephemeral Personalization Sheet / Drawer */}
      <MineralPersonalizer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handlePersonalizationSubmit}
        initialProfile={currentProfile}
      />
    </section>
  );
}
