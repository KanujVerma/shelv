'use client';

import React, { useState } from 'react';
import { SAMPLE_PRODUCTS, type SampleProductItem } from '@/lib/sample-products';
import { QuickReadCard } from './quick-read-card';
import { EphemeralPersonalizer } from './ephemeral-personalizer';
import { PersonalizedVerdictCard } from './personalized-verdict-card';
import { AppBridgeCta } from './app-bridge-cta';
import type { WebQuickRead, WebPersonalFitPreview, EphemeralProfile, ProductIdentity } from '@/lib/derive-intelligence';
import { trackEvent } from '@/lib/analytics';

interface HeroCheckProps {
  onCheckStarted?: () => void;
}

export function HeroCheck({ onCheckStarted }: HeroCheckProps) {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [quickRead, setQuickRead] = useState<WebQuickRead | null>(null);
  const [product, setProduct] = useState<ProductIdentity | null>(null);
  const [personalVerdict, setPersonalVerdict] = useState<WebPersonalFitPreview | null>(null);
  const [currentProfile, setCurrentProfile] = useState<EphemeralProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorSuggestions, setErrorSuggestions] = useState<Array<{ label: string; url: string }> | null>(null);

  React.useEffect(() => {
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
    setErrorSuggestions(null);
    setQuickRead(null);
    setPersonalVerdict(null);
    onCheckStarted?.();
    trackEvent('web_check_started');

    try {
      setLoadingStep('Reading product page...');
      await new Promise((r) => setTimeout(r, 450));

      setLoadingStep('Resolving product and formula evidence...');
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: trimmed.startsWith('http') ? trimmed : undefined,
          query: !trimmed.startsWith('http') ? trimmed : undefined,
          ephemeralProfile: profileOverride || currentProfile || undefined,
        }),
      });

      setLoadingStep('Checking routine stacking & considerations...');
      await new Promise((r) => setTimeout(r, 400));

      const data = await res.json();

      if (!res.ok || !data.success) {
        trackEvent('web_check_unknown');
        setErrorMessage(data.error || 'Could not retrieve verified product information from that link.');
        if (data.errorRecovery?.sampleSuggestions) {
          setErrorSuggestions(data.errorRecovery.sampleSuggestions);
        }
        return;
      }

      trackEvent('web_check_resolved');
      trackEvent('quick_read_viewed');
      setProduct(data.product);
      setQuickRead(data.quickRead);

      if (data.personalFit) {
        trackEvent('personal_result_viewed');
        setPersonalVerdict(data.personalFit);
      }
    } catch (err) {
      console.error(err);
      trackEvent('web_check_unknown');
      setErrorMessage('Network error while checking this product link. Please try again.');
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
    trackEvent('personalization_completed');

    if (product) {
      setLoading(true);
      setLoadingStep('Personalizing decision based on your skin context...');

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
          trackEvent('personal_result_viewed');
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
    <section id="check-hero" className="pt-28 pb-16 px-4 sm:px-8 max-w-4xl mx-auto">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-[#171A18] tracking-tight leading-[1.18] max-w-3xl mx-auto break-words">
          Know whether a skincare product actually makes sense before you put it on your face.
        </h1>
        <p className="text-[15px] sm:text-[17px] text-[#626760] max-w-2xl mx-auto leading-relaxed">
          Paste any skincare product link. Get an evidence-bound Quick Read with zero fluff, then add 15 seconds of context to see the decision sharpen.
        </p>
      </div>

      {/* Main Interactive Liquid-Glass Input Box */}
      <div className="relative max-w-2xl mx-auto">
        <form
          onSubmit={handleFormSubmit}
          className="liquid-glass-input rounded-2xl p-2 sm:p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 transition-all w-full max-w-full"
        >
          <div className="flex-1 min-w-0 flex items-center px-3 min-h-[46px]">
            <svg
              className="w-5 h-5 text-[#626760] shrink-0 mr-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Paste a Sephora, Ulta, or skincare link..."
              className="w-full min-w-0 bg-transparent text-[14px] sm:text-[16px] text-[#171A18] placeholder-[#626760]/70 focus:outline-none"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="bg-[#345447] hover:bg-[#284237] disabled:opacity-50 disabled:cursor-not-allowed text-[#FFFEFB] text-[14px] font-medium px-6 py-3 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap min-h-[46px]"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-[#FFFEFB]/40 border-t-[#FFFEFB] rounded-full animate-spin" />
                <span>Checking</span>
              </span>
            ) : (
              <>
                <span>Check product</span>
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </form>

        {/* Microcopy Trust Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-2 pt-2.5 gap-1 text-[11px] sm:text-[12px] font-mono text-[#626760]">
          <span>No account · Free · Strict Privacy</span>
          <span>Sephora · Ulta · Target · Brand sites</span>
        </div>
      </div>

      {/* Quick-Try Product Chips */}
      <div className="mt-6 text-center">
        <p className="text-[13px] text-[#626760] mb-2.5 font-medium">
          Or try a verified benchmark product:
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {SAMPLE_PRODUCTS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSampleClick(sample)}
              disabled={loading}
              className="text-[13px] px-3.5 py-1.5 rounded-full bg-[#FFFEFB] border border-[#EAE5DC] text-[#171A18] hover:border-[#345447] hover:bg-[#E2EAE4]/50 transition-all active:scale-95 shadow-2xs font-sans"
            >
              {sample.chipLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Sequence Feedback */}
      {loading && (
        <div className="mt-8 mineral-card rounded-2xl p-6 text-center space-y-3 animate-in fade-in duration-300">
          <div className="w-8 h-8 border-2 border-[#345447]/20 border-t-[#345447] rounded-full animate-spin mx-auto" />
          <p className="text-[15px] font-serif font-medium text-[#171A18]">
            {loadingStep}
          </p>
          <p className="text-[12px] font-mono text-[#626760]">
            Shelv evaluates product & formula truth deterministically
          </p>
        </div>
      )}

      {/* Graceful Error & Fallback Recovery */}
      {errorMessage && !loading && (
        <div className="mt-8 p-6 rounded-2xl bg-[#FBF4E6] border border-[#E8DCB8] space-y-3 text-left">
          <div className="flex items-center gap-2 text-[#8A6B2D] font-bold text-[14px]">
            <span>⚠️</span>
            <span>Could Not Extract Complete Product Evidence</span>
          </div>
          <p className="text-[14px] text-[#171A18] leading-relaxed">
            {errorMessage}
          </p>
          {errorSuggestions && errorSuggestions.length > 0 && (
            <div className="pt-2 space-y-2">
              <p className="text-[13px] font-semibold text-[#8A6B2D]">
                Try one of these verified products instead:
              </p>
              <div className="flex flex-wrap gap-2">
                {errorSuggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputValue(sug.url);
                      runAnalysis(sug.url);
                    }}
                    className="text-[12px] px-3 py-1 rounded-full bg-[#FFFEFB] border border-[#E8DCB8] text-[#171A18] hover:bg-[#EAE5DC]"
                  >
                    {sug.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Container */}
      {(quickRead || personalVerdict) && !loading && (
        <div className="mt-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
          {/* Level 2: Transformed Personalized Verdict */}
          {personalVerdict && product && (
            <PersonalizedVerdictCard
              verdict={personalVerdict}
              product={product}
              onEditContext={() => setIsModalOpen(true)}
            />
          )}

          {/* Level 1: Web Quick Read */}
          {quickRead && (
            <QuickReadCard
              quickRead={quickRead}
              onPersonalizeClick={() => {
                trackEvent('personalize_clicked');
                setIsModalOpen(true);
              }}
              isPersonalized={!!personalVerdict}
            />
          )}

          {/* Level 3: App Bridge CTA */}
          {personalVerdict && <AppBridgeCta />}
        </div>
      )}

      {/* Ephemeral Personalization Modal */}
      <EphemeralPersonalizer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handlePersonalizationSubmit}
        initialProfile={currentProfile}
      />
    </section>
  );
}
