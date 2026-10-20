import { siteConfig } from '../config'

type Gtag = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
    __unoAnalyticsLoaded?: boolean
  }
}

const GA_SCRIPT_ID = 'uno-ga4-script'
let analyticsEnabled = false

/**
 * Loads GA4 only after the visitor has granted analytics consent. The consent
 * default in index.html keeps analytics_storage denied until then.
 */
export function initAnalytics(): void {
  if (analyticsEnabled || !siteConfig.gaMeasurementId || typeof window === 'undefined') return

  analyticsEnabled = true
  window.dataLayer = window.dataLayer || []
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args)
    }

  if (!document.getElementById(GA_SCRIPT_ID)) {
    const script = document.createElement('script')
    script.id = GA_SCRIPT_ID
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(siteConfig.gaMeasurementId)}`
    document.head.appendChild(script)
  }

  window.gtag?.('js', new Date())
  window.gtag?.('config', siteConfig.gaMeasurementId, {
    anonymize_ip: true,
    send_page_view: true,
  })
}

export function setAnalyticsAllowed(allowed: boolean): void {
  if (typeof window === 'undefined') return
  window.gtag?.('consent', 'update', { analytics_storage: allowed ? 'granted' : 'denied' })
  if (!allowed) analyticsEnabled = false
}

export function track(event: string, params: Record<string, string | number | boolean | undefined> = {}): void {
  if (!analyticsEnabled || typeof window === 'undefined') return
  window.gtag?.('event', event, params)
}

export function trackPageView(page: string): void {
  if (!analyticsEnabled) return
  window.gtag?.('event', 'page_view', {
    page_title: document.title,
    page_location: window.location.href,
    page_path: page,
  })
}
