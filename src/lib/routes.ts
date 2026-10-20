import { useEffect, useState } from 'react'

export const ROUTES = ['app', 'about', 'privacy', 'terms', 'contact'] as const
export type Route = (typeof ROUTES)[number]

export function parseRoute(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '').replace(/\/+$/, '').toLowerCase()
  if (clean === 'about' || clean === 'privacy' || clean === 'terms' || clean === 'contact') {
    return clean
  }
  return 'app'
}

export function routeHref(route: Route): string {
  return route === 'app' ? '#/' : `#/${route}`
}

export function routeTitle(route: Route): string {
  switch (route) {
    case 'about':
      return 'About — UNO Classic'
    case 'privacy':
      return 'Privacy Policy — UNO Classic'
    case 'terms':
      return 'Terms of Use — UNO Classic'
    case 'contact':
      return 'Contact — UNO Classic'
    default:
      return 'UNO Classic — Free Card Game Against AI'
  }
}

export function routeDescription(route: Route): string {
  switch (route) {
    case 'about':
      return 'Learn about UNO Classic, a free browser card game with AI opponents, house rules and match scoring.'
    case 'privacy':
      return 'How UNO Classic handles game saves, analytics, cookies and Google AdSense advertising data.'
    case 'terms':
      return 'Terms of use for the free UNO Classic browser card game.'
    case 'contact':
      return 'Contact the UNO Classic team with feedback, bug reports or privacy requests.'
    default:
      return 'Play UNO Classic free in your browser against smart AI opponents.'
  }
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() =>
    parseRoute(typeof window === 'undefined' ? '' : window.location.hash),
  )

  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash))
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}
