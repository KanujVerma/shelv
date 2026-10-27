'use client';

import React, { useState, useEffect } from 'react';
import { SAMPLE_PRODUCTS, type SampleProductItem } from '@/lib/sample-products';
import type { WebQuickRead, WebPersonalFitPreview, EphemeralProfile, ProductIdentity } from '@/lib/derive-intelligence';
import { trackEvent } from '@/lib/analytics';
import { EditorialResult } from './editorial-result';
import { EditorialPersonalizer } from './editorial-personalizer';
import { EditorialNarrative } from './editorial-narrative';

export function EditorialHero() {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [quickRead, setQuickRead] = useState<WebQuickRead | null>(null);
  const [product, setProduct] = useState<ProductIdentity | null>(null);
  const [personalVerdict, setPersonalVerdict] = useState<WebPersonalFitPreview | null>(null);
  const [currentProfile, setCurrentProfile] = useState<EphemeralProfile | null>(null);
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
      setLoadingStep('Resolving formula chemistry & active mechanisms...');
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

  const handleSampleClick = (sample: SampleProductItem) => {
    setInputValue(sample.url);
    runAnalysis(sample.url);
  };

  const handlePersonalizationSubmit = async (profile: EphemeralProfile) => {
    setCurrentProfile(profile);
    setIsModalOpen(false);

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
    <section className="pt-16 sm:pt-24 pb-16 px-4 sm:px-8 max-w-5xl mx-auto">
      {/* Editorial Grid: Asymmetrical Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16">
        <div className="lg:col-span-7 space-y-4">
          <span className="text-[11px] font-sans font-semibold uppercase tracking-widest text-[#626760]">
            Conservative Product Intelligence
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-normal text-[#171A18] tracking-tight leading-[1.14]">
            A skincare decision, <br className="hidden sm:inline" />
            <em className="font-serif italic font-normal">not a score.</em>
          </h1>
          <p className="text-[15px] sm:text-[16px] text-[#626760] font-sans leading-relaxed max-w-xl">
            Formulas do not act in a vacuum. What calms one skin barrier irritates another. Paste any product to see what the active chemistry actually does, then add your skin context to see whether it belongs on your face.
          </p>
        </div>

        {/* Architectural Input Column */}
        <div className="lg:col-span-5 pt-2">
          <form
            onSubmit={handleFormSubmit}
            className="p-4 sm:p-5 rounded-xl bg-[#FFFEFB] border border-[#EAE5DC] shadow-sm space-y-3"
          >
            <label className="text-[12px] font-sans font-semibold text-[#171A18] uppercase tracking-wider block">
              Evaluate a Formula
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Paste a Sephora, Ulta, or skincare link..."
              className="w-full bg-[#F6F3EC]/60 border border-[#EAE5DC] rounded-lg px-3.5 py-2.5 text-[14px] text-[#171A18] placeholder-[#626760]/60 focus:outline-none focus:border-[#345447] focus:bg-[#FFFEFB] transition-all"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="w-full bg-[#171A18] hover:bg-[#345447] disabled:opacity-40 disabled:cursor-not-allowed text-[#FFFEFB] text-[13px] font-sans font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-[#FFFEFB]/40 border-t-[#FFFEFB] rounded-full animate-spin" />
                  <span>Evaluating...</span>
                </span>
              ) : (
                <span>Analyze Formula →</span>
              )}
            </button>

            {/* Benchmark Sample Links */}
            <div className="pt-2 text-[12px] text-[#626760] font-sans flex items-center gap-2">
              <span className="opacity-75">Benchmarks:</span>
              <button
                type="button"
                onClick={() => handleSampleClick(SAMPLE_PRODUCTS[0])}
                className="text-[#171A18] hover:text-[#345447] underline underline-offset-2 transition-colors cursor-pointer"
              >
                Paula's 2% BHA
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => handleSampleClick(SAMPLE_PRODUCTS[1])}
                className="text-[#171A18] hover:text-[#345447] underline underline-offset-2 transition-colors cursor-pointer"
              >
                The Ordinary 10%
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Loading Feedback */}
      {loading && (
        <div className="py-12 border-t border-[#EAE5DC] text-center space-y-3 animate-in fade-in duration-300">
          <div className="w-6 h-6 border-2 border-[#171A18]/20 border-t-[#171A18] rounded-full animate-spin mx-auto" />
          <p className="text-[14px] font-serif italic text-[#171A18]">
            {loadingStep}
          </p>
        </div>
      )}

      {/* Error Feedback */}
      {errorMessage && !loading && (
        <div className="p-5 rounded-lg bg-[#FBF4E6] border border-[#E8DCB8] text-[13px] text-[#8A6B2D] space-y-1 mb-8">
          <p className="font-semibold">Unable to resolve authoritative product formula</p>
          <p className="text-[#171A18]">{errorMessage}</p>
        </div>
      )}

      {/* Results Section */}
      {(quickRead || personalVerdict) && !loading && (
        <div className="border-t border-[#EAE5DC] pt-12 space-y-12">
          <EditorialResult
            quickRead={quickRead}
            personalVerdict={personalVerdict}
            product={product}
            onOpenPersonalizer={() => setIsModalOpen(true)}
          />

          <EditorialNarrative />
        </div>
      )}

      {/* Editorial Personalizer Modal */}
      <EditorialPersonalizer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handlePersonalizationSubmit}
        initialProfile={currentProfile}
      />
    </section>
  );
}
