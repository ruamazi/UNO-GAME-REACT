import { useCallback, useEffect, useRef } from 'react'

type SfxName = 'click' | 'play' | 'draw' | 'uno' | 'win' | 'bad' | 'challenge' | 'menu'

interface Tone {
  frequency: number
  endFrequency?: number
  duration: number
  type: OscillatorType
  gain: number
  delay?: number
}

const RECIPES: Record<SfxName, Tone[]> = {
  click: [{ frequency: 380, endFrequency: 300, duration: 0.05, type: 'triangle', gain: 0.05 }],
  play: [
    { frequency: 620, endFrequency: 240, duration: 0.08, type: 'triangle', gain: 0.09 },
    { frequency: 180, endFrequency: 120, duration: 0.1, type: 'sine', gain: 0.06, delay: 0.01 },
  ],
  draw: [
    { frequency: 220, endFrequency: 520, duration: 0.12, type: 'sawtooth', gain: 0.028 },
    { frequency: 320, endFrequency: 660, duration: 0.14, type: 'sine', gain: 0.04, delay: 0.03 },
  ],
  uno: [
    { frequency: 660, duration: 0.1, type: 'square', gain: 0.05 },
    { frequency: 990, duration: 0.14, type: 'square', gain: 0.05, delay: 0.1 },
  ],
  win: [
    { frequency: 523, duration: 0.14, type: 'triangle', gain: 0.08 },
    { frequency: 659, duration: 0.14, type: 'triangle', gain: 0.08, delay: 0.12 },
    { frequency: 784, duration: 0.14, type: 'triangle', gain: 0.08, delay: 0.24 },
    { frequency: 1046, duration: 0.32, type: 'triangle', gain: 0.09, delay: 0.36 },
  ],
  bad: [{ frequency: 200, endFrequency: 90, duration: 0.28, type: 'square', gain: 0.05 }],
  challenge: [
    { frequency: 340, endFrequency: 180, duration: 0.12, type: 'sawtooth', gain: 0.045 },
    { frequency: 520, endFrequency: 260, duration: 0.16, type: 'triangle', gain: 0.05, delay: 0.1 },
  ],
  menu: [{ frequency: 520, endFrequency: 780, duration: 0.12, type: 'sine', gain: 0.05 }],
}

export interface SoundApi {
  play: (name: SfxName) => void
}

export function useSound(enabled: boolean): SoundApi {
  const contextRef = useRef<AudioContext | null>(null)

  const getContext = useCallback(() => {
    if (typeof window === 'undefined') return null
    if (!contextRef.current) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      contextRef.current = new Ctor()
    }
    if (contextRef.current.state === 'suspended') {
      void contextRef.current.resume()
    }
    return contextRef.current
  }, [])

  const play = useCallback(
    (name: SfxName) => {
      if (!enabled) return
      const context = getContext()
      if (!context) return

      const now = context.currentTime
      for (const tone of RECIPES[name]) {
        const start = now + (tone.delay ?? 0)
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = tone.type
        oscillator.frequency.setValueAtTime(tone.frequency, start)
        if (tone.endFrequency) {
          oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, tone.endFrequency), start + tone.duration)
        }
        gain.gain.setValueAtTime(0.0001, start)
        gain.gain.exponentialRampToValueAtTime(tone.gain, start + 0.012)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration)
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.start(start)
        oscillator.stop(start + tone.duration + 0.03)
      }
    },
    [enabled, getContext],
  )

  useEffect(() => {
    return () => {
      void contextRef.current?.close().catch(() => undefined)
      contextRef.current = null
    }
  }, [])

  return { play }
}
