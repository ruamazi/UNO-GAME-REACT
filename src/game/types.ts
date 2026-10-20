export const COLORS = ['red', 'yellow', 'green', 'blue'] as const

export type CardColor = (typeof COLORS)[number]
export type CardKind = 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4'

export interface Card {
  /** Unique id, e.g. `red-7-a` */
  id: string
  color: CardColor | 'wild'
  kind: CardKind
  /** 0-9, only for number cards */
  value?: number
}

export interface Player {
  id: number
  name: string
  avatar: string
  isHuman: boolean
  hand: Card[]
  score: number
  /** True when the player safely said UNO and has one card left. */
  unoCalled: boolean
  /** Rounds won, for the stats panel. */
  roundsWon: number
}

export type Difficulty = 'chill' | 'sharp'
export type Speed = 'relaxed' | 'normal' | 'fast'

export interface GameSettings {
  /** Total players, including the human. 2-6. */
  playerCount: number
  targetScore: number
  /** Allow +2 / +4 cards to be stacked onto a pending draw. */
  stacking: boolean
  /** Keep drawing until a playable card appears. */
  drawUntilPlayable: boolean
  /** Wild Draw Four may only be played when you have no card of the current color. */
  strictWild4: boolean
  difficulty: Difficulty
  speed: Speed
  soundOn: boolean
  playerName: string
  playerAvatar: string
}

export const DEFAULT_SETTINGS: GameSettings = {
  playerCount: 4,
  targetScore: 500,
  stacking: false,
  drawUntilPlayable: false,
  strictWild4: true,
  difficulty: 'sharp',
  speed: 'normal',
  soundOn: true,
  playerName: 'You',
  playerAvatar: '🧑‍🚀',
}

export interface PendingDraw {
  count: number
  source: 'draw2' | 'wild4'
  /** Who caused the pending draw, used for logs. */
  causePlayer: number
}

export interface PendingWild4 {
  offender: number
  target: number
  cardId: string
  /** Color that was in effect before the Wild Draw Four was played. */
  previousColor: CardColor
  chosenColor: CardColor
}

export interface ColorChoice {
  playerIndex: number
  /** Card still in hand awaiting a color; null for an already-played top card or challenge resolution. */
  cardId: string | null
  source: 'hand' | 'start' | 'challenge'
}

export type TurnPhase = 'idle' | 'drawn' | 'chooseColor' | 'wild4Response' | 'roundOver' | 'matchOver'
export type GamePhase = 'playing' | 'roundOver' | 'matchOver'

export interface UnoState {
  playerIndex: number
  called: boolean
  /** Timestamp after which an uncalled UNO can no longer be caught. */
  expiresAt: number
}

export type LogTone = 'info' | 'good' | 'bad' | 'human' | 'bot'

export interface LogEntry {
  id: number
  text: string
  tone: LogTone
}

export interface RoundBreakdown {
  playerIndex: number
  cards: number
  points: number
}

export interface RoundResult {
  winnerIndex: number
  points: number
  breakdown: RoundBreakdown[]
}

export interface GameState {
  phase: GamePhase
  settings: GameSettings
  players: Player[]
  deck: Card[]
  discard: Card[]
  currentPlayer: number
  direction: 1 | -1
  currentColor: CardColor
  turnPhase: TurnPhase
  pendingDraw: PendingDraw | null
  pendingWild4: PendingWild4 | null
  colorChoice: ColorChoice | null
  /** When set, only this freshly drawn card may be played. */
  drawnCardId: string | null
  uno: UnoState | null
  /** Human pressed the UNO button before playing their second-to-last card. */
  unoArmed: boolean
  log: LogEntry[]
  logSeq: number
  round: number
  roundResult: RoundResult | null
  matchWinner: number | null
  lastPlayedCardId: string | null
  /** Increments on every completed action so the UI can animate. */
  tick: number
}
