/**
 * Privacy-Preserving Web Analytics Helper
 *
 * Adheres strictly to Derive's Safety & Privacy Invariants:
 * - NO transmission of skin goals, treatments, sensitivities, or ingredient text.
 * - Anonymous, privacy-safe lifecycle funnel metrics only.
 * - Inert console logging in development.
 */

export type AnalyticsEvent =
  | 'landing_visit'
  | 'web_check_started'
  | 'web_check_resolved'
  | 'web_check_unknown'
  | 'quick_read_viewed'
  | 'personalize_clicked'
  | 'personalization_completed'
  | 'personal_result_viewed'
  | 'app_cta_clicked'
  | 'managed_cta_clicked';

export function trackEvent(eventName: AnalyticsEvent, metadata?: { source?: string; retailer?: string }) {
  // In development, log cleanly without leaking sensitive payload
  if (process.env.NODE_ENV !== 'production') {
    // console.log(`[Derive Privacy Analytics] ${eventName}`, metadata || {});
  }
}
