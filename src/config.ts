const env = import.meta.env

function text(value: string | undefined, fallback = ''): string {
  return (value ?? '').trim() || fallback
}

function trimmedUrl(value: string | undefined): string {
  return text(value).replace(/\/+$/, '')
}

export interface AdSlots {
  startTop: string
  startBottom: string
  game: string
}

export const siteConfig = {
  siteName: text(env.VITE_SITE_NAME, 'UNO Classic'),
  siteUrl: trimmedUrl(env.VITE_SITE_URL),
  contactEmail: text(env.VITE_CONTACT_EMAIL, 'support@your-domain.com'),
  adsenseClient: text(env.VITE_ADSENSE_CLIENT),
  adSlots: {
    startTop: text(env.VITE_ADSENSE_SLOT_START_TOP),
    startBottom: text(env.VITE_ADSENSE_SLOT_START_BOTTOM),
    game: text(env.VITE_ADSENSE_SLOT_GAME),
  } satisfies AdSlots,
  gaMeasurementId: text(env.VITE_GA_ID),
  googleCmp: text(env.VITE_GOOGLE_CMP).toLowerCase() === 'true',
  customConsent: text(env.VITE_CUSTOM_CONSENT, 'true').toLowerCase() !== 'false',
} as const

export function hasAdSlot(slot: string): boolean {
  return Boolean(siteConfig.adsenseClient && slot)
}

export function sitePath(path: string): string {
  const base = siteConfig.siteUrl
  return base ? `${base}${path.startsWith('/') ? path : `/${path}`}` : path
}
