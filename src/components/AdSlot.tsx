import { useEffect, useRef } from 'react'
import { hasAdSlot, siteConfig } from '../config'
import { useConsent } from '../lib/consent'

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

type AdFormat = 'auto' | 'fluid' | 'rectangle'

/**
 * A single responsive AdSense unit. Ad slots are only mounted after the
 * visitor grants advertising consent, and only when a publisher ID plus slot
 * ID are configured. AdSense's script tag is injected at build time by
 * vite.config.ts.
 */
export function AdSlot({
  slot,
  format = 'auto',
  minHeight = 90,
  className = '',
  label = 'Advertisement',
}: {
  slot: string
  format?: AdFormat
  minHeight?: number
  className?: string
  label?: string
}) {
  const { adsAllowed } = useConsent()
  const insetRef = useRef<HTMLModElement>(null)
  const pushed = useRef(false)
  const enabled = hasAdSlot(slot) && adsAllowed

  useEffect(() => {
    if (!enabled || pushed.current) return
    const element = insetRef.current
    if (!element) return

    // AdSense stamps data-ad-status once it has processed this unit.
    if (element.getAttribute('data-ad-status')) {
      pushed.current = true
      return
    }

    try {
      window.adsbygoogle = window.adsbygoogle || []
      window.adsbygoogle.push({})
      pushed.current = true
    } catch {
      // Ad blockers or a failed network request should never break the game.
    }
  }, [enabled])

  if (!enabled) {
    if (import.meta.env.DEV && !siteConfig.adsenseClient) {
      return (
        <div
          className={`flex items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/15 text-center text-[10px] font-bold uppercase tracking-widest text-white/30 ${className}`}
          style={{ minHeight }}
          aria-hidden="true"
        >
          Ad space · add VITE_ADSENSE_CLIENT
        </div>
      )
    }
    return null
  }

  return (
    <aside aria-label={label} className={className}>
      <p className="mb-1 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">{label}</p>
      <ins
        ref={insetRef}
        className="adsbygoogle block w-full"
        style={{ display: 'block', minHeight }}
        data-ad-client={siteConfig.adsenseClient}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </aside>
  )
}
