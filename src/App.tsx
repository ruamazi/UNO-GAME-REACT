import { useCallback, useEffect, useRef, useState } from 'react'
import { GameTable } from './components/GameTable'
import { LegalPage } from './components/LegalPages'
import { StartScreen } from './components/StartScreen'
import { ToastStack } from './components/ToastStack'
import { siteConfig } from './config'
import { DEFAULT_SETTINGS, type GameSettings } from './game/types'
import { useUnoGame } from './hooks/useUnoGame'
import { trackPageView } from './lib/analytics'
import { ConsentProvider } from './lib/consent'
import { routeDescription, routeTitle, useHashRoute } from './lib/routes'

const STORAGE_KEY = 'uno.settings.v1'

function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<GameSettings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      playerCount: Math.min(6, Math.max(2, Number(parsed.playerCount) || DEFAULT_SETTINGS.playerCount)),
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export default function App() {
  const route = useHashRoute()
  const [settings, setSettings] = useState<GameSettings>(loadSettings)
  const api = useUnoGame(settings, { active: route === 'app' })
  const initialRoute = useRef(route)
  const inGame = api.state !== null

  useEffect(() => {
    document.querySelector<HTMLElement>('[data-app-scroll]')?.scrollTo({ top: 0 })
  }, [route, inGame])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Storage may be unavailable (private mode) — settings simply won't persist.
    }
  }, [settings])

  useEffect(() => {
    document.title = routeTitle(route)
    const description = document.querySelector('meta[name="description"]')
    if (description) description.setAttribute('content', routeDescription(route))

    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) ogTitle.setAttribute('content', routeTitle(route))
    const ogDescription = document.querySelector('meta[property="og:description"]')
    if (ogDescription) ogDescription.setAttribute('content', routeDescription(route))

    if (route !== initialRoute.current) {
      trackPageView(route === 'app' ? '/' : `/#/${route}`)
    }
  }, [route])

  useEffect(() => {
    if (!siteConfig.siteUrl) return
    const canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) canonical.setAttribute('href', `${siteConfig.siteUrl}/`)
  }, [])

  const patchSettings = useCallback((patch: Partial<GameSettings>) => {
    setSettings((current) => ({ ...current, ...patch }))
  }, [])

  return (
    <ConsentProvider>
      <div className="h-full">
        {route === 'app' ? (
          api.state ? (
            <GameTable api={api} settings={settings} onChangeSettings={patchSettings} />
          ) : (
            <StartScreen
              settings={settings}
              savedGame={api.savedGame}
              onChange={patchSettings}
              onStart={api.startMatch}
              onResume={api.resumeSaved}
              onDiscardSaved={api.discardSaved}
            />
          )
        ) : (
          <LegalPage route={route} />
        )}
        <ToastStack toasts={api.toasts} onDone={api.dismissToast} />
      </div>
    </ConsentProvider>
  )
}
