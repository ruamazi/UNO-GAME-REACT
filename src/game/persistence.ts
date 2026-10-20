import {
  COLORS,
  type Card,
  type CardColor,
  type CardKind,
  type GameSettings,
  type GameState,
  type LogTone,
} from './types'

const SAVE_KEY = 'uno.save.v1'
const SAVE_VERSION = 1

export interface SavedGame {
  state: GameState
  savedAt: number
}

interface SaveEnvelope {
  version: number
  savedAt: number
  state: GameState
}

const CARD_COLORS: readonly (CardColor | 'wild')[] = [...COLORS, 'wild']
const CARD_KINDS: readonly CardKind[] = ['number', 'skip', 'reverse', 'draw2', 'wild', 'wild4']
const TONES: readonly LogTone[] = ['info', 'good', 'bad', 'human', 'bot']
const PHASES = ['playing', 'roundOver', 'matchOver'] as const
const TURN_PHASES = ['idle', 'drawn', 'chooseColor', 'wild4Response', 'roundOver', 'matchOver'] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCard(value: unknown): value is Card {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    CARD_COLORS.includes(value.color as CardColor | 'wild') &&
    CARD_KINDS.includes(value.kind as CardKind) &&
    (value.value === undefined || typeof value.value === 'number')
  )
}

function isCardArray(value: unknown): value is Card[] {
  return Array.isArray(value) && value.every(isCard)
}

function isSettings(value: unknown): value is GameSettings {
  if (!isRecord(value)) return false
  return (
    typeof value.playerCount === 'number' &&
    typeof value.targetScore === 'number' &&
    typeof value.stacking === 'boolean' &&
    typeof value.drawUntilPlayable === 'boolean' &&
    typeof value.strictWild4 === 'boolean' &&
    (value.difficulty === 'chill' || value.difficulty === 'sharp') &&
    (value.speed === 'relaxed' || value.speed === 'normal' || value.speed === 'fast') &&
    typeof value.soundOn === 'boolean' &&
    typeof value.playerName === 'string' &&
    typeof value.playerAvatar === 'string'
  )
}

function isPlayer(value: unknown): boolean {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'number' &&
    typeof value.name === 'string' &&
    typeof value.avatar === 'string' &&
    typeof value.isHuman === 'boolean' &&
    isCardArray(value.hand) &&
    typeof value.score === 'number' &&
    typeof value.unoCalled === 'boolean' &&
    typeof value.roundsWon === 'number'
  )
}

function isColor(value: unknown): value is CardColor {
  return COLORS.includes(value as CardColor)
}

function isPendingDraw(value: unknown): boolean {
  if (value === null) return true
  if (!isRecord(value)) return false
  return (
    typeof value.count === 'number' &&
    value.count > 0 &&
    (value.source === 'draw2' || value.source === 'wild4') &&
    typeof value.causePlayer === 'number'
  )
}

function isPendingWild4(value: unknown): boolean {
  if (value === null) return true
  if (!isRecord(value)) return false
  return (
    typeof value.offender === 'number' &&
    typeof value.target === 'number' &&
    typeof value.cardId === 'string' &&
    isColor(value.previousColor) &&
    isColor(value.chosenColor)
  )
}

function isColorChoice(value: unknown): boolean {
  if (value === null) return true
  if (!isRecord(value)) return false
  return (
    typeof value.playerIndex === 'number' &&
    (value.cardId === null || typeof value.cardId === 'string') &&
    (value.source === 'hand' || value.source === 'start' || value.source === 'challenge')
  )
}

function isUnoState(value: unknown): boolean {
  if (value === null) return true
  if (!isRecord(value)) return false
  return (
    typeof value.playerIndex === 'number' &&
    typeof value.called === 'boolean' &&
    typeof value.expiresAt === 'number'
  )
}

function isState(value: unknown): value is GameState {
  if (!isRecord(value)) return false
  if (!PHASES.includes(value.phase as (typeof PHASES)[number])) return false
  if (!isSettings(value.settings)) return false
  if (!Array.isArray(value.players) || value.players.length < 2 || value.players.length > 6) return false
  if (!value.players.every(isPlayer)) return false
  if (value.players.length !== value.settings.playerCount) return false
  if (!value.players[0]?.isHuman) return false
  if (!isCardArray(value.deck) || !isCardArray(value.discard) || value.discard.length === 0) return false
  if (typeof value.currentPlayer !== 'number' || value.currentPlayer < 0 || value.currentPlayer >= value.players.length) {
    return false
  }
  if (value.direction !== 1 && value.direction !== -1) return false
  if (!isColor(value.currentColor)) return false
  if (!TURN_PHASES.includes(value.turnPhase as (typeof TURN_PHASES)[number])) return false
  if (!Array.isArray(value.log)) return false
  if (!value.log.every((entry) => isRecord(entry) && typeof entry.id === 'number' && typeof entry.text === 'string' && TONES.includes(entry.tone as LogTone))) {
    return false
  }
  return (
    isPendingDraw(value.pendingDraw) &&
    isPendingWild4(value.pendingWild4) &&
    isColorChoice(value.colorChoice) &&
    isUnoState(value.uno) &&
    (value.drawnCardId === null || typeof value.drawnCardId === 'string') &&
    typeof value.logSeq === 'number' &&
    typeof value.round === 'number' &&
    typeof value.tick === 'number' &&
    (value.roundResult === null || isRecord(value.roundResult)) &&
    (value.matchWinner === null || typeof value.matchWinner === 'number') &&
    (value.lastPlayedCardId === null || typeof value.lastPlayedCardId === 'string') &&
    typeof value.unoArmed === 'boolean'
  )
}

/** Parses and validates a saved envelope. Exported for tests and migrations. */
export function parseSavedGame(raw: string | null): SavedGame | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<SaveEnvelope>
    if (parsed.version !== SAVE_VERSION) return null
    if (typeof parsed.savedAt !== 'number' || !Number.isFinite(parsed.savedAt)) return null
    if (!isState(parsed.state)) return null
    return { state: parsed.state, savedAt: parsed.savedAt }
  } catch {
    return null
  }
}

export function serializeSavedGame(state: GameState, savedAt = Date.now()): string {
  const envelope: SaveEnvelope = { version: SAVE_VERSION, savedAt, state }
  return JSON.stringify(envelope)
}

export function loadSavedGame(): SavedGame | null {
  if (typeof window === 'undefined') return null
  try {
    return parseSavedGame(window.localStorage.getItem(SAVE_KEY))
  } catch {
    return null
  }
}

export function saveGame(state: GameState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SAVE_KEY, serializeSavedGame(state))
  } catch {
    // Private mode or a full quota — the current session still works.
  }
}

export function clearSavedGame(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(SAVE_KEY)
  } catch {
    // Nothing to do.
  }
}
