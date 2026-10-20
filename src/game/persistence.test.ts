import { describe, expect, it } from 'vitest'
import { startRound } from './engine'
import { parseSavedGame, serializeSavedGame } from './persistence'
import { DEFAULT_SETTINGS, type GameState } from './types'

function playableState(): GameState {
  return startRound({
    settings: { ...DEFAULT_SETTINGS, playerCount: 3 },
    round: 2,
    starter: 1,
    rng: () => 0.42,
  })
}

function envelope(state: GameState): Record<string, unknown> {
  return JSON.parse(serializeSavedGame(state, 123_456)) as Record<string, unknown>
}

describe('saved games', () => {
  it('round-trips a valid game and timestamp', () => {
    const state = playableState()
    const parsed = parseSavedGame(serializeSavedGame(state, 987_654))

    expect(parsed?.savedAt).toBe(987_654)
    expect(parsed?.state).toEqual(state)
  })

  it('rejects missing, corrupt and version-mismatched envelopes', () => {
    expect(parseSavedGame(null)).toBeNull()
    expect(parseSavedGame('')).toBeNull()
    expect(parseSavedGame('{not-json')).toBeNull()
    expect(parseSavedGame(JSON.stringify({ version: '1' }))).toBeNull()

    const oldVersion = { ...envelope(playableState()), version: 0 }
    expect(parseSavedGame(JSON.stringify(oldVersion))).toBeNull()
  })

  it('rejects states with inconsistent player counts or missing cards', () => {
    const base = envelope(playableState())
    const mismatched = structuredClone(base)
    const state = mismatched.state as Record<string, unknown>
    state.settings = { ...(state.settings as Record<string, unknown>), playerCount: 5 }

    const noDiscard = structuredClone(base)
    ;(noDiscard.state as Record<string, unknown>).discard = []

    expect(parseSavedGame(JSON.stringify(mismatched))).toBeNull()
    expect(parseSavedGame(JSON.stringify(noDiscard))).toBeNull()
  })

  it('rejects malformed nested turn state', () => {
    const base = envelope(playableState())

    const badDraw = structuredClone(base)
    ;(badDraw.state as Record<string, unknown>).pendingDraw = { count: 2, causePlayer: 0 }

    const badChoice = structuredClone(base)
    ;(badChoice.state as Record<string, unknown>).colorChoice = { playerIndex: 0, source: 'elsewhere' }

    const badUno = structuredClone(base)
    ;(badUno.state as Record<string, unknown>).uno = { playerIndex: 0, called: 'yes' }

    expect(parseSavedGame(JSON.stringify(badDraw))).toBeNull()
    expect(parseSavedGame(JSON.stringify(badChoice))).toBeNull()
    expect(parseSavedGame(JSON.stringify(badUno))).toBeNull()
  })
})
