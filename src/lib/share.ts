import { track } from './analytics'

const ANNOUNCEMENT =
  'UNO Classic — free browser card game against smart AI opponents. Play a round:'

export type ShareResult = 'shared' | 'copied' | 'dismissed' | 'failed'

function fallbackCopy(text: string): boolean {
  if (typeof document === 'undefined') return false
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(area)
  }
}

/** Shares text through the native share sheet, with a clipboard fallback. */
export async function shareText(text: string, url: string): Promise<ShareResult> {
  const payload = { title: 'UNO Classic', text, url }

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(payload)
      track('share', { method: 'native' })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'dismissed'
    }
  }

  const clipboardText = `${text}\n${url}`
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(clipboardText)
    } else if (!fallbackCopy(clipboardText)) {
      throw new Error('Clipboard unavailable')
    }
    track('share', { method: 'clipboard' })
    return 'copied'
  } catch {
    return 'failed'
  }
}

export function shareAppUrl(): string {
  if (typeof window === 'undefined') return 'https://example.com'
  return window.location.origin + window.location.pathname
}

export function shareAnnouncement(): string {
  return ANNOUNCEMENT
}
