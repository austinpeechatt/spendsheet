/**
 * Plausible analytics event tracking.
 * Events are only sent in production (Plausible script must be loaded).
 * No cookies, no personal data, GDPR-compliant.
 */

type EventName =
  | 'upload_started'
  | 'report_generated'
  | 'pdf_downloaded'
  | 'report_saved'
  | 'sample_data_used'

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void
  }
}

export function trackEvent(name: EventName, props?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(name, props ? { props } : undefined)
  }
}
