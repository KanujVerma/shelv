'use client';

import React, { useState, useEffect } from 'react';
import { SAMPLE_PRODUCTS, type SampleProductItem } from '@/lib/sample-products';
import type { WebQuickRead, WebPersonalFitPreview, EphemeralProfile, ProductIdentity } from '@/lib/derive-intelligence';
import { trackEvent } from '@/lib/analytics';
import { SynthesisResult } from './synthesis-result';
import { SynthesisPersonalizer } from './synthesis-personalizer';
import { SynthesisAppBridge } from './synthesis-app-bridge';

export function SynthesisHero() {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [quickRead, setQuickRead] = useState<WebQuickRead | null>(null);
  const [product, setProduct] = useState<ProductIdentity | null>(null);
  const [personalVerdict, setPersonalVerdict] = useState<WebPersonalFitPreview | null>(null);
  const [currentProfile, setCurrentProfile] = useState<EphemeralProfile | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
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
      setLoadingStep('Reading packaging & formula...');
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
        setErrorMessage(data.error || 'Could not verify product details from that link.');
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

  const handleBenchmarkClick = (sample: SampleProductItem) => {
    setInputValue(sample.url);
    runAnalysis(sample.url);
  };

  const handlePersonalizationSubmit = async (profile: EphemeralProfile) => {
    setCurrentProfile(profile);
    setIsSheetOpen(false);

    if (product) {
      setLoading(true);
      setLoadingStep('Evaluating formula against your skin context...');

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
    <section className="pt-24 sm:pt-32 pb-12 px-4 sm:px-6 max-w-2xl mx-auto font-sans">
      {/* Direction C: Ultra-Minimal Tool Pitch */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[#171A18] leading-[1.15] break-words">
          Know before you buy.
        </h1>
        <p className="text-[14px] sm:text-[15px] text-[#626760]">
          Paste a skincare link. Get an honest answer.
        </p>
      </div>

      {/* Direction A: Apple Liquid Glass Composer Capsule */}
      <div className="space-y-3">
        <form
          onSubmit={handleFormSubmit}
          className="rounded-2xl p-2 sm:p-2.5 bg-[#FFFEFB]/85 backdrop-blur-xl border border-[#EAE5DC] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2 transition-all hover:border-[#345447]/30 focus-within:border-[#345447]/60 focus-within:shadow-md"
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
              placeholder="Paste any skincare link..."
              className="w-full min-w-0 bg-transparent text-[14px] sm:text-[15px] text-[#171A18] placeholder-[#626760]/60 focus:outline-none font-sans"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="bg-[#345447] hover:bg-[#284237] disabled:opacity-40 disabled:cursor-not-allowed text-[#FFFEFB] text-[13px] font-medium px-5 py-2.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[42px]"
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

        {/* Quiet Benchmark Affordances */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[12px] text-[#626760] font-sans px-2">
          <span className="opacity-75">Or test:</span>
          <button
            type="button"
            onClick={() => handleBenchmarkClick(SAMPLE_PRODUCTS[0])}
            className="text-[#171A18] hover:text-[#345447] underline underline-offset-3 transition-colors cursor-pointer"
          >
            Paula's Choice 2% BHA
          </button>
          <span className="opacity-40">·</span>
          <button
            type="button"
            onClick={() => handleBenchmarkClick(SAMPLE_PRODUCTS[1])}
            className="text-[#171A18] hover:text-[#345447] underline underline-offset-3 transition-colors cursor-pointer"
          >
            The Ordinary Niacinamide
          </button>
        </div>
      </div>

      {/* Loading Feedback */}
      {loading && (
        <div className="mt-8 p-6 text-center space-y-2.5 bg-[#FFFEFB] rounded-2xl border border-[#EAE5DC] animate-in fade-in duration-200">
          <div className="w-5 h-5 border-2 border-[#345447]/20 border-t-[#345447] rounded-full animate-spin mx-auto" />
          <p className="text-[13px] text-[#626760] font-medium">{loadingStep}</p>
        </div>
      )}

      {/* Error Feedback */}
      {errorMessage && !loading && (
        <div className="mt-6 p-4 rounded-xl bg-[#FBF4E6] border border-[#E8DCB8] text-[13px] text-[#8A6B2D]">
          {errorMessage}
        </div>
      )}

      {/* Result Surface & Persistent Bridge */}
      {(quickRead || personalVerdict) && !loading && (
        <div className="mt-8 space-y-6">
          <SynthesisResult
            quickRead={quickRead}
            personalVerdict={personalVerdict}
            product={product}
            onOpenSheet={() => setIsSheetOpen(true)}
          />

          <SynthesisAppBridge />
        </div>
      )}

      {/* iOS-Style Personalization Bottom Sheet with Liquid Glass Chrome */}
      <SynthesisPersonalizer
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSubmit={handlePersonalizationSubmit}
        initialProfile={currentProfile}
      />
    </section>
  );
}
