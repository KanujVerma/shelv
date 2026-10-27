'use client';

import React, { useState, useEffect } from 'react';
import { SAMPLE_PRODUCTS, type SampleProductItem } from '@/lib/sample-products';
import type { WebQuickRead, WebPersonalFitPreview, EphemeralProfile, ProductIdentity } from '@/lib/derive-intelligence';
import { trackEvent } from '@/lib/analytics';
import { NativeResultView } from './native-result-view';
import { NativeSheetPersonalizer } from './native-sheet-personalizer';
import { NativeMemoryBridge } from './native-memory-bridge';

export function NativeUtilityHero() {
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
        setErrorMessage(data.error || 'Product not recognized.');
        return;
      }

      setProduct(data.product);
      setQuickRead(data.quickRead);
      if (data.personalFit) {
        setPersonalVerdict(data.personalFit);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Network error while checking. Try again.');
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
      setLoadingStep('Personalizing decision...');

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
    <section className="py-12 sm:py-20 px-4 sm:px-6 max-w-2xl mx-auto font-sans">
      {/* Ultra-Minimal Utility Pitch */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#171A18] tracking-tight">
          Know before you buy.
        </h1>
        <p className="text-[14px] text-[#626760]">
          Paste a skincare link. Get an honest answer.
        </p>
      </div>

      {/* Prominent Native Input Composer */}
      <div className="space-y-3">
        <form
          onSubmit={handleFormSubmit}
          className="flex items-center gap-2 p-1.5 rounded-xl bg-[#FFFEFB] border border-[#EAE5DC] shadow-sm focus-within:border-[#345447] focus-within:ring-1 focus-within:ring-[#345447] transition-all"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Paste any skincare link..."
            className="flex-1 min-w-0 bg-transparent px-3 py-2 text-[14px] sm:text-[15px] text-[#171A18] placeholder-[#626760]/60 focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="bg-[#345447] hover:bg-[#284237] disabled:opacity-40 text-[#FFFEFB] text-[13px] font-medium px-4 py-2 rounded-lg transition-all shrink-0"
          >
            {loading ? 'Checking...' : 'Check'}
          </button>
        </form>

        {/* Single Subtle Benchmark Affordance */}
        <div className="text-center text-[12px] text-[#626760]">
          <span>Or test: </span>
          <button
            type="button"
            onClick={() => handleBenchmarkClick(SAMPLE_PRODUCTS[0])}
            className="text-[#171A18] hover:text-[#345447] underline underline-offset-2 transition-colors cursor-pointer"
          >
            Paula's Choice 2% BHA →
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-8 p-6 text-center space-y-2 bg-[#FFFEFB] rounded-xl border border-[#EAE5DC] animate-in fade-in duration-200">
          <div className="w-5 h-5 border-2 border-[#345447]/20 border-t-[#345447] rounded-full animate-spin mx-auto" />
          <p className="text-[13px] text-[#626760]">{loadingStep}</p>
        </div>
      )}

      {/* Error */}
      {errorMessage && !loading && (
        <div className="mt-6 p-4 rounded-xl bg-[#FBF4E6] border border-[#E8DCB8] text-[13px] text-[#8A6B2D]">
          {errorMessage}
        </div>
      )}

      {/* Native Result Screen */}
      {(quickRead || personalVerdict) && !loading && (
        <div className="mt-8 space-y-6">
          <NativeResultView
            quickRead={quickRead}
            personalVerdict={personalVerdict}
            product={product}
            onOpenSheet={() => setIsSheetOpen(true)}
          />

          <NativeMemoryBridge />
        </div>
      )}

      {/* Native Bottom Sheet */}
      <NativeSheetPersonalizer
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSubmit={handlePersonalizationSubmit}
        initialProfile={currentProfile}
      />
    </section>
  );
}
