import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { siteConfig } from '../config'
import { initAnalytics, setAnalyticsAllowed, track } from './analytics'

const STORAGE_KEY = 'uno.consent.v1'
const CONSENT_VERSION = 1

export interface ConsentChoice {
  version: number
  ads: boolean
  analytics: boolean
  savedAt: number
}

export interface ConsentPreferences {
  ads: boolean
  analytics: boolean
}

function readStoredConsent(): ConsentChoice | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ConsentChoice>
    if (
      parsed.version !== CONSENT_VERSION ||
      typeof parsed.ads !== 'boolean' ||
      typeof parsed.analytics !== 'boolean'
    ) {
      return null
    }
    return {
      version: CONSENT_VERSION,
      ads: parsed.ads,
      analytics: parsed.analytics,
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
    }
  } catch {
    return null
  }
}

function persistConsent(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(choice))
  } catch {
    // Storage may be unavailable in private mode. The choice lasts this session.
  }
}

export function applyGoogleConsent(preferences: ConsentPreferences): void {
  if (typeof window === 'undefined') return
  window.gtag?.('consent', 'update', {
    ad_storage: preferences.ads ? 'granted' : 'denied',
    ad_user_data: preferences.ads ? 'granted' : 'denied',
    ad_personalization: preferences.ads ? 'granted' : 'denied',
    analytics_storage: preferences.analytics ? 'granted' : 'denied',
  })
}

export function adsAllowedFor(choice: ConsentChoice | null): boolean {
  return Boolean(siteConfig.googleCmp || choice?.ads)
}

interface ConsentApi {
  choice: ConsentChoice | null
  adsAllowed: boolean
  preferencesOpen: boolean
  openPreferences: () => void
  closePreferences: () => void
  savePreferences: (preferences: ConsentPreferences) => void
  acceptAll: () => void
  rejectAll: () => void
}

const ConsentContext = createContext<ConsentApi | null>(null)

export function useConsent(): ConsentApi {
  const value = useContext(ConsentContext)
  if (!value) throw new Error('useConsent must be used inside <ConsentProvider>')
  return value
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<ConsentChoice | null>(readStoredConsent)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [draft, setDraft] = useState<ConsentPreferences>({
    ads: choice?.ads ?? false,
    analytics: choice?.analytics ?? false,
  })

  const applyChoice = useCallback((preferences: ConsentPreferences) => {
    const next: ConsentChoice = {
      version: CONSENT_VERSION,
      ads: preferences.ads,
      analytics: preferences.analytics,
      savedAt: Date.now(),
    }
    setChoice(next)
    persistConsent(next)
    applyGoogleConsent(preferences)
    setAnalyticsAllowed(preferences.analytics)
    if (preferences.analytics) initAnalytics()
    track('consent_update', { ads: preferences.ads, analytics: preferences.analytics })
  }, [])

  useEffect(() => {
    if (!choice) return
    applyGoogleConsent(choice)
    if (choice.analytics) initAnalytics()
  }, [choice])

  const savePreferences = useCallback(
    (preferences: ConsentPreferences) => {
      applyChoice(preferences)
      setPreferencesOpen(false)
    },
    [applyChoice],
  )

  const acceptAll = useCallback(() => {
    setDraft({ ads: true, analytics: true })
    applyChoice({ ads: true, analytics: true })
    setPreferencesOpen(false)
  }, [applyChoice])

  const rejectAll = useCallback(() => {
    setDraft({ ads: false, analytics: false })
    applyChoice({ ads: false, analytics: false })
    setPreferencesOpen(false)
  }, [applyChoice])

  const openPreferences = useCallback(() => {
    setDraft({ ads: choice?.ads ?? false, analytics: choice?.analytics ?? false })
    setPreferencesOpen(true)
  }, [choice])

  const closePreferences = useCallback(() => setPreferencesOpen(false), [])

  const value = useMemo<ConsentApi>(
    () => ({
      choice,
      adsAllowed: adsAllowedFor(choice),
      preferencesOpen,
      openPreferences,
      closePreferences,
      savePreferences,
      acceptAll,
      rejectAll,
    }),
    [
      choice,
      preferencesOpen,
      openPreferences,
      closePreferences,
      savePreferences,
      acceptAll,
      rejectAll,
    ],
  )

  const showBanner = !choice && siteConfig.customConsent && !siteConfig.googleCmp

  return (
    <ConsentContext.Provider value={value}>
      <div className="flex h-full min-h-0 flex-col">
        <div data-app-scroll className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </div>

        {showBanner && (
          <div
            role="region"
            aria-label="Cookie consent"
            className="consent-banner relative z-40 shrink-0 border-t border-white/15 bg-[#041f17]/95 px-4 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur"
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
              <p className="min-w-0 flex-1 text-xs leading-relaxed text-white/75 sm:text-[13px]">
                <strong className="text-white">Cookies &amp; ads.</strong> We use essential storage to save your game
                and optional analytics/advertising cookies. Read our{' '}
                <a href="#/privacy" className="font-semibold text-uno-yellow underline underline-offset-2">
                  Privacy Policy
                </a>
                .
              </p>
              <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2 lg:shrink-0">
                <button
                  type="button"
                  onClick={rejectAll}
                  className="rounded-lg border border-white/20 bg-white/5 px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-white/85 transition-colors hover:bg-white/15 sm:px-3.5 sm:text-xs"
                >
                  Essential only
                </button>
                <button
                  type="button"
                  onClick={openPreferences}
                  className="rounded-lg px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-white/65 transition-colors hover:text-white sm:px-3.5 sm:text-xs"
                >
                  Customize
                </button>
                <button
                  type="button"
                  onClick={acceptAll}
                  className="rounded-lg bg-uno-yellow px-2.5 py-2 text-[10px] font-black uppercase tracking-wider text-uno-black transition-colors hover:bg-yellow-300 sm:px-4 sm:text-xs"
                >
                  Accept all
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {preferencesOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close cookie settings"
            className="absolute inset-0 cursor-default bg-black/65 backdrop-blur-sm"
            onClick={closePreferences}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-settings-title"
            className="glass animate-rise-in relative w-full max-w-md rounded-2xl p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 id="cookie-settings-title" className="font-display text-xl text-white">
                Cookie settings
              </h2>
              <button
                type="button"
                onClick={closePreferences}
                aria-label="Close"
                className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
                <p className="flex items-center justify-between gap-3 text-sm font-bold text-white">
                  Essential
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/60">
                    Always on
                  </span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-white/55">
                  Saves your settings, current match and consent choice in your browser.
                </p>
              </div>

              <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-3.5">
                <span>
                  <span className="block text-sm font-bold text-white">Advertising</span>
                  <span className="mt-1 block text-xs leading-relaxed text-white/55">
                    Allows Google AdSense to show personalised ads and measure them.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={draft.ads}
                  onChange={(event) => setDraft((current) => ({ ...current, ads: event.target.checked }))}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-uno-yellow"
                />
              </label>

              <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-3.5">
                <span>
                  <span className="block text-sm font-bold text-white">Analytics</span>
                  <span className="mt-1 block text-xs leading-relaxed text-white/55">
                    Helps us understand which features people enjoy. No personal details are sold.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={draft.analytics}
                  onChange={(event) => setDraft((current) => ({ ...current, analytics: event.target.checked }))}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-uno-yellow"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={rejectAll}
                className="rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-white/15"
              >
                Reject optional
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-white/15"
              >
                Accept all
              </button>
              <button
                type="button"
                onClick={() => savePreferences(draft)}
                className="rounded-lg bg-uno-yellow px-4 py-2 text-xs font-black uppercase tracking-wider text-uno-black hover:bg-yellow-300"
              >
                Save choices
              </button>
            </div>
          </div>
        </div>
      )}
    </ConsentContext.Provider>
  )
}
