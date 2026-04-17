/**
 * Umami analytics event tracking.
 * Events are only sent in production (Umami script must be loaded).
 * No cookies, no personal data, GDPR-compliant, free tier.
 */

type EventName =
  | 'upload_started'
  | 'report_generated'
  | 'pdf_downloaded'
  | 'report_saved'
  | 'sample_data_used'

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, string | number>) => void
    }
  }
}

export function trackEvent(name: EventName, data?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track(name, data)
  }
}
