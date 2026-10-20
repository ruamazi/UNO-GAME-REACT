import { cardName, cardPoints, createDeck, handPoints, shuffle } from './cards'
import {
  COLORS,
  type Card,
  type CardColor,
  type GameSettings,
  type GameState,
  type LogTone,
  type Player,
  type TurnPhase,
} from './types'

export type Rng = () => number

/** Milliseconds a player who reached one card has to be caught before UNO is safe. */
export const UNO_WINDOW_MS = 2600

const BOT_PROFILES: { name: string; avatar: string }[] = [
  { name: 'Maya', avatar: '🦊' },
  { name: 'Leo', avatar: '🐼' },
  { name: 'Zoe', avatar: '🦉' },
  { name: 'Max', avatar: '🐸' },
  { name: 'Nia', avatar: '🐯' },
]

export function botForgetChance(settings: GameSettings): number {
  return settings.difficulty === 'sharp' ? 0.06 : 0.28
}

export function createPlayers(settings: GameSettings): Player[] {
  const players: Player[] = [
    {
      id: 0,
      name: settings.playerName.trim() || 'You',
      avatar: settings.playerAvatar,
      isHuman: true,
      hand: [],
      score: 0,
      unoCalled: false,
      roundsWon: 0,
    },
  ]
  for (let i = 0; i < Math.min(5, Math.max(1, settings.playerCount - 1)); i++) {
    const profile = BOT_PROFILES[i]
    players.push({
      id: i + 1,
      name: profile.name,
      avatar: profile.avatar,
      isHuman: false,
      hand: [],
      score: 0,
      unoCalled: false,
      roundsWon: 0,
    })
  }
  return players
}

export function topDiscard(state: GameState): Card {
  return state.discard[state.discard.length - 1]
}

export function nextIndex(state: Pick<GameState, 'players' | 'direction'>, from: number, steps = 1): number {
  const count = state.players.length
  return (((from + state.direction * steps) % count) + count) % count
}

function appendLog(state: GameState, text: string, tone: LogTone = 'info'): GameState {
  const entry = { id: state.logSeq + 1, text, tone }
  const log = [...state.log, entry].slice(-140)
  return { ...state, log, logSeq: entry.id }
}

function appendLogs(state: GameState, entries: [string, LogTone?][]): GameState {
  return entries.reduce((acc, [text, tone]) => appendLog(acc, text, tone), state)
}

const playerAt = (state: GameState, index: number) => state.players[index]
const nameOf = (state: GameState, index: number) => playerAt(state, index).name

/** "You draw 2 cards" / "Maya draws 2 cards" */
function drawVerb(player: Player, count: number): string {
  const cards = count === 1 ? 'card' : 'cards'
  return player.isHuman ? `You draw ${count} ${cards}` : `${player.name} draws ${count} ${cards}`
}

/** Any non-wild card in hand matching the given color. */
export function hasColorMatch(hand: Card[], color: CardColor): boolean {
  return hand.some((card) => card.color === color)
}

function sameSymbol(a: Card, b: Card): boolean {
  if (a.kind === 'number' && b.kind === 'number') return a.value === b.value
  if (a.kind === b.kind) return a.kind !== 'number'
  return false
}

/** Does the card follow the current top card (ignoring hand/house-rule restrictions)? */
export function followsTop(state: GameState, card: Card): boolean {
  if (card.color === 'wild') return true
  if (card.color === state.currentColor) return true
  return sameSymbol(card, topDiscard(state))
}

/** Cards the player is allowed to play right now. */
export function legalCards(state: GameState, playerIndex: number): Card[] {
  if (state.phase !== 'playing') return []
  if (playerIndex !== state.currentPlayer) return []
  if (state.colorChoice && !state.pendingDraw) return []
  if (state.turnPhase === 'roundOver' || state.turnPhase === 'matchOver') return []

  const player = state.players[playerIndex]
  const pending = state.pendingDraw

  if (state.turnPhase === 'wild4Response') {
    if (!state.pendingWild4 || state.pendingWild4.target !== playerIndex) return []
    if (!state.settings.stacking || !pending) return []
    return player.hand.filter((card) => card.kind === 'draw2' || card.kind === 'wild4')
  }

  if (pending && pending.count > 0) {
    if (!state.settings.stacking) return []
    return player.hand.filter((card) => card.kind === 'draw2' || card.kind === 'wild4')
  }

  let pool = player.hand
  if (state.turnPhase === 'drawn') {
    pool = player.hand.filter((card) => card.id === state.drawnCardId)
  }

  return pool.filter((card) => {
    if (!followsTop(state, card)) return false
    if (card.kind === 'wild4') {
      if (state.turnPhase === 'drawn' && card.id !== state.drawnCardId) return false
      if (state.settings.strictWild4 && hasColorMatch(player.hand, state.currentColor)) return false
    }
    return true
  })
}

export function isPlayable(state: GameState, cardId: string, playerIndex: number): boolean {
  return legalCards(state, playerIndex).some((card) => card.id === cardId)
}

// ---------------------------------------------------------------------------
// Deck helpers
// ---------------------------------------------------------------------------

interface DrawResult {
  state: GameState
  card: Card | null
  reshuffled: boolean
}

function takeTop(state: GameState, rng: Rng): DrawResult {
  let deck = state.deck
  let discard = state.discard
  let reshuffled = false

  if (deck.length === 0) {
    if (discard.length <= 1) return { state, card: null, reshuffled: false }
    const top = discard[discard.length - 1]
    deck = shuffle(discard.slice(0, -1), rng)
    discard = [top]
    reshuffled = true
  }

  const card = deck[deck.length - 1]
  const next: GameState = {
    ...state,
    deck: deck.slice(0, -1),
    discard,
  }
  return { state: next, card, reshuffled }
}

function giveCards(
  state: GameState,
  playerIndex: number,
  count: number,
  rng: Rng,
): { state: GameState; cards: Card[] } {
  let next = state
  const drawn: Card[] = []
  let reshuffled = false
  for (let i = 0; i < count; i++) {
    const result = takeTop(next, rng)
    next = result.state
    reshuffled = reshuffled || result.reshuffled
    if (!result.card) break
    drawn.push(result.card)
  }

  const players = next.players.map((player, index) => {
    if (index !== playerIndex) return player
    const hand = [...player.hand, ...drawn]
    return { ...player, hand, unoCalled: hand.length === 1 ? player.unoCalled : false }
  })
  next = { ...next, players }
  if (reshuffled) next = appendLog(next, 'Draw pile empty — discard pile reshuffled.', 'info')
  return { state: { ...next, tick: next.tick + 1 }, cards: drawn }
}

function clearUnoAfterDraw(state: GameState, playerIndex: number, count: number): GameState {
  if (count > 0 && state.uno && state.uno.playerIndex === playerIndex) {
    return { ...state, uno: null, unoArmed: state.players[playerIndex].isHuman ? false : state.unoArmed }
  }
  return state
}

// ---------------------------------------------------------------------------
// Round setup
// ---------------------------------------------------------------------------

export interface StartRoundOptions {
  settings: GameSettings
  players?: Player[]
  round: number
  starter: number
  rng?: Rng
}

export function startRound({ settings, players, round, starter, rng = Math.random }: StartRoundOptions): GameState {
  const roster = players ? players.map((p) => ({ ...p, hand: [], unoCalled: false })) : createPlayers(settings)
  const deck = shuffle(createDeck(), rng)
  const hands: Card[][] = roster.map(() => [])
  let cursor = deck.length - 1

  for (let cardIndex = 0; cardIndex < 7; cardIndex++) {
    for (let playerIndex = 0; playerIndex < roster.length; playerIndex++) {
      hands[playerIndex].push(deck[cursor--])
    }
  }

  const dealtPlayers = roster.map((player, index) => ({ ...player, hand: hands[index] }))
  let state: GameState = {
    phase: 'playing',
    settings,
    players: dealtPlayers,
    deck: deck.slice(0, cursor + 1),
    discard: [],
    currentPlayer: starter % dealtPlayers.length,
    direction: 1,
    currentColor: 'red',
    turnPhase: 'idle',
    pendingDraw: null,
    pendingWild4: null,
    colorChoice: null,
    drawnCardId: null,
    uno: null,
    unoArmed: false,
    log: [],
    logSeq: 0,
    round,
    roundResult: null,
    matchWinner: null,
    lastPlayedCardId: null,
    tick: 0,
  }

  state = appendLog(
    state,
    round === 1 ? 'New game — good luck!' : `Round ${round} begins.`,
    'good',
  )

  const first = state.currentPlayer
  let direction: 1 | -1 = 1
  let currentPlayer = first
  let pendingDraw: GameState['pendingDraw'] = null
  let colorChoice: GameState['colorChoice'] = null
  let turnPhase: TurnPhase = 'idle'

  // Flip the starting card, applying its effect (Wild Draw Four is never a starter).
  for (let guard = 0; guard < 60; guard++) {
    const result = takeTop(state, rng)
    state = result.state
    const card = result.card
    if (!card) break

    if (card.kind === 'wild4') {
      const index = Math.floor(rng() * (state.deck.length + 1))
      const deck = [...state.deck]
      deck.splice(index, 0, card)
      state = { ...state, deck }
      continue
    }

    state = { ...state, discard: [card] }
    if (card.color !== 'wild') {
      state = { ...state, currentColor: card.color }
    }

    switch (card.kind) {
      case 'wild':
        colorChoice = { playerIndex: first, cardId: null, source: 'start' }
        turnPhase = 'chooseColor'
        state = appendLog(state, `${nameOf(state, first)} starts with a Wild and must choose the color.`, 'info')
        break
      case 'skip': {
        const skipped = nameOf(state, first)
        currentPlayer = nextIndex({ players: state.players, direction }, first)
        state = appendLog(
          state,
          state.players[first].isHuman
            ? 'You start with a Skip — you lose the first turn.'
            : `${skipped} starts with a Skip — ${skipped} loses the first turn.`,
          'info',
        )
        break
      }
      case 'reverse':
        if (state.players.length === 2) {
          currentPlayer = nextIndex({ players: state.players, direction }, first)
          state = appendLog(state, `Starts with a Reverse — it acts as a Skip in a two-player game.`, 'info')
        } else {
          direction = -1
          state = appendLog(state, 'Starts with a Reverse — the play order is reversed.', 'info')
        }
        break
      case 'draw2': {
        pendingDraw = { count: 2, source: 'draw2', causePlayer: first }
        currentPlayer = first
        state = appendLog(
          state,
          state.players[first].isHuman
            ? 'Starts with a Draw Two — you must draw 2 and lose the first turn.'
            : `Starts with a Draw Two — ${nameOf(state, first)} must draw 2 and loses the first turn.`,
          'bad',
        )
        break
      }
      default:
        state = appendLog(state, `${nameOf(state, first)} goes first.`, 'info')
        break
    }
    break
  }

  return {
    ...state,
    direction,
    currentPlayer,
    pendingDraw,
    colorChoice,
    turnPhase,
    tick: state.tick + 1,
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function beginPlay(
  state: GameState,
  playerIndex: number,
  cardId: string,
  now: number,
  rng: Rng = Math.random,
): GameState {
  if (state.phase !== 'playing' || playerIndex !== state.currentPlayer) return state
  if (state.turnPhase !== 'idle' && state.turnPhase !== 'drawn' && state.turnPhase !== 'wild4Response') return state
  if (state.pendingDraw && !state.settings.stacking) return state
  if (!isPlayable(state, cardId, playerIndex)) return state

  const card = state.players[playerIndex].hand.find((c) => c.id === cardId)
  if (!card) return state

  if (card.color === 'wild') {
    return {
      ...state,
      colorChoice: { playerIndex, cardId, source: 'hand' },
      turnPhase: 'chooseColor',
      tick: state.tick + 1,
    }
  }
  return completePlay(state, playerIndex, card, undefined, now, rng)
}

function completePlay(
  state: GameState,
  playerIndex: number,
  card: Card,
  chosenColor: CardColor | undefined,
  now: number,
  rng: Rng,
): GameState {
  const player = state.players[playerIndex]
  const hand = player.hand.filter((c) => c.id !== card.id)
  const discard = [...state.discard, card]
  const currentColor: CardColor = card.color === 'wild' ? (chosenColor ?? state.currentColor) : card.color
  const hadPending = state.pendingDraw && state.pendingDraw.count > 0 ? state.pendingDraw : null
  const stackedOn = hadPending?.count ?? 0

  let direction = state.direction
  let currentPlayer = nextIndex(state, playerIndex)
  let pendingDraw: GameState['pendingDraw'] = null
  let pendingWild4: GameState['pendingWild4'] = null
  let turnPhase: TurnPhase = 'idle'
  const notes: [string, LogTone?][] = []
  const playerName = player.name

  switch (card.kind) {
    case 'number':
      if (state.turnPhase === 'drawn') {
        notes.push([`${playerName} played the drawn ${cardName(card)}.`])
      }
      break
    case 'skip': {
      const skipped = nameOf(state, nextIndex(state, playerIndex))
      currentPlayer = nextIndex(state, playerIndex, 2)
      notes.push([`${playerName} played a ${cardName(card)} — ${skipped} loses a turn.`, 'bot'])
      break
    }
    case 'reverse':
      if (state.players.length === 2) {
        currentPlayer = playerIndex
        notes.push([`${playerName} played a ${cardName(card)} — Reverse acts as a Skip in a two-player game.`, 'bot'])
      } else {
        direction = (state.direction * -1) as 1 | -1
        currentPlayer = nextIndex({ players: state.players, direction }, playerIndex)
        notes.push([`${playerName} played a ${cardName(card)} — direction reversed!`, 'bot'])
      }
      break
    case 'draw2': {
      const count = stackedOn + 2
      pendingDraw = { count, source: 'draw2', causePlayer: playerIndex }
      currentPlayer = nextIndex(state, playerIndex)
      notes.push(
        stackedOn > 0
          ? [`${playerName} stacked a Draw Two — the next player must draw ${count}!`, 'bad']
          : [`${playerName} played a ${cardName(card)}.`, 'bot'],
      )
      break
    }
    case 'wild':
      notes.push([`${playerName} played a Wild and chose ${currentColor}.`, 'bot'])
      break
    case 'wild4': {
      const count = stackedOn + 4
      pendingDraw = { count, source: 'wild4', causePlayer: playerIndex }
      pendingWild4 = {
        offender: playerIndex,
        target: nextIndex(state, playerIndex),
        cardId: card.id,
        previousColor: state.currentColor,
        chosenColor: currentColor,
      }
      currentPlayer = nextIndex(state, playerIndex)
      turnPhase = 'wild4Response'
      notes.push(
        stackedOn > 0
          ? [`${playerName} stacked a Wild Draw Four — ${nameOf(state, currentPlayer)} must draw ${count}!`, 'bad']
          : [`${playerName} played a Wild Draw Four and chose ${currentColor}.`, 'bad'],
      )
      break
    }
  }

  let players = state.players.map((p, index) =>
    index === playerIndex ? { ...p, hand, unoCalled: hand.length === 1 ? p.unoCalled : false } : p,
  )
  let uno = state.uno
  let unoArmed = state.unoArmed

  if (hand.length === 1) {
    const forgot = !player.isHuman && rng() < botForgetChance(state.settings)
    const called = player.isHuman ? state.unoArmed : !forgot
    uno = { playerIndex, called, expiresAt: now + UNO_WINDOW_MS }
    if (player.isHuman) unoArmed = false
    notes.push(
      called
        ? [player.isHuman ? 'You call UNO!' : `${playerName} calls UNO!`, 'good']
        : player.isHuman
          ? [`You're down to one card and didn't call UNO...`, 'bad']
          : [`${playerName} is down to one card and didn't call UNO...`, 'bad'],
    )
  } else if (uno && uno.playerIndex === playerIndex) {
    uno = null
  }

  const roundOver = hand.length === 0
  if (roundOver) {
    const breakdown = state.players
      .map((p, index) => ({ playerIndex: index, cards: p.hand.length, points: handPoints(p.hand) }))
      .filter((row) => row.playerIndex !== playerIndex)
    const points = breakdown.reduce((total, row) => total + row.points, 0)

    players = players.map((p, index) =>
      index === playerIndex ? { ...p, score: p.score + points, roundsWon: p.roundsWon + 1 } : p,
    )
    const wonMatch = players[playerIndex].score >= state.settings.targetScore

    const finished = appendLogs(
      {
        ...state,
        players,
        discard,
        currentColor,
        direction,
        currentPlayer,
        turnPhase: wonMatch ? 'matchOver' : 'roundOver',
        pendingDraw: null,
        pendingWild4: null,
        colorChoice: null,
        drawnCardId: null,
        uno: null,
        unoArmed,
        lastPlayedCardId: card.id,
        tick: state.tick + 1,
      },
      [...notes, [`${playerName} wins the round and scores ${points} points!`, 'good']],
    )
    return {
      ...finished,
      phase: wonMatch ? 'matchOver' : 'roundOver',
      roundResult: { winnerIndex: playerIndex, points, breakdown },
      matchWinner: wonMatch ? playerIndex : null,
    }
  }

  const nextState: GameState = {
    ...state,
    players,
    discard,
    currentColor,
    direction,
    currentPlayer,
    turnPhase,
    pendingDraw,
    pendingWild4,
    colorChoice: null,
    drawnCardId: null,
    uno,
    unoArmed,
    lastPlayedCardId: card.id,
    tick: state.tick + 1,
  }
  return appendLogs(nextState, notes)
}

export function chooseColor(
  state: GameState,
  playerIndex: number,
  color: CardColor,
  now: number,
  rng: Rng = Math.random,
): GameState {
  const choice = state.colorChoice
  if (!choice || choice.playerIndex !== playerIndex) return state

  if (choice.source === 'hand' && choice.cardId) {
    const card = state.players[playerIndex].hand.find((c) => c.id === choice.cardId)
    if (!card) return { ...state, colorChoice: null, turnPhase: 'idle' }
    const cleared: GameState = { ...state, colorChoice: null, turnPhase: 'idle' }
    return completePlay(cleared, playerIndex, card, color, now, rng)
  }

  const next = appendLog(state, `${state.players[playerIndex].name} chose ${color}.`, 'info')
  return { ...next, currentColor: color, colorChoice: null, turnPhase: 'idle', tick: next.tick + 1 }
}

export function drawCard(
  state: GameState,
  playerIndex: number,
  _now: number,
  rng: Rng = Math.random,
): GameState {
  if (state.phase !== 'playing' || playerIndex !== state.currentPlayer) return state
  if (state.turnPhase !== 'idle') return state
  if (state.pendingDraw && state.pendingDraw.count > 0) return state

  const player = state.players[playerIndex]
  const before = player.hand.length
  let drawnCount = 0
  let result: { state: GameState; cards: Card[] } = { state, cards: [] }
  let drawnCard: Card | null = null

  const drawOne = () => {
    result = giveCards(result.state, playerIndex, 1, rng)
    drawnCount += result.cards.length
    drawnCard = result.cards[result.cards.length - 1] ?? drawnCard
  }

  drawOne()
  const untilPlayable = state.settings.drawUntilPlayable
  if (untilPlayable) {
    let guard = 0
    while (drawnCard && guard < 40 && !followsTop(result.state, drawnCard)) {
      drawOne()
      guard++
    }
  }

  if (drawnCount === 0) {
    // Completely out of cards — pass the turn.
    const next = appendLog(state, `${player.name} cannot draw — no cards left. Turn passes.`, 'info')
    return { ...next, currentPlayer: nextIndex(next, playerIndex), tick: next.tick + 1 }
  }

  let next = result.state
  if (before + drawnCount > 2) next = { ...next, unoArmed: false }
  next = clearUnoAfterDraw(next, playerIndex, drawnCount)

  const text =
    drawnCount === 1
      ? `${player.name} drew a card.`
      : untilPlayable
        ? `${player.name} drew ${drawnCount} cards looking for a play.`
        : `${player.name} drew ${drawnCount} cards.`
  next = appendLog(next, text, player.isHuman ? 'human' : 'info')

  return {
    ...next,
    drawnCardId: result.cards[result.cards.length - 1]?.id ?? null,
    turnPhase: 'drawn',
    tick: next.tick + 1,
  }
}

export function passTurn(state: GameState, playerIndex: number, _now: number): GameState {
  if (state.phase !== 'playing' || playerIndex !== state.currentPlayer) return state
  if (state.turnPhase !== 'drawn' && state.turnPhase !== 'idle') return state
  if (state.pendingDraw && state.pendingDraw.count > 0) return state

  const player = state.players[playerIndex]
  const next = appendLog(state, `${player.name} passed.`, player.isHuman ? 'human' : 'info')

  return {
    ...next,
    currentPlayer: nextIndex(next, playerIndex),
    turnPhase: 'idle',
    drawnCardId: null,
    tick: next.tick + 1,
  }
}

export function takePendingDraw(
  state: GameState,
  playerIndex: number,
  _now: number,
  rng: Rng = Math.random,
): GameState {
  if (state.phase !== 'playing' || playerIndex !== state.currentPlayer) return state
  const pending = state.pendingDraw
  if (!pending || pending.count <= 0) return state

  const count = pending.count
  const player = state.players[playerIndex]
  const result = giveCards(state, playerIndex, count, rng)
  let next = result.state
  next = clearUnoAfterDraw(next, playerIndex, count)

  next = appendLogs(next, [
    [
      pending.source === 'wild4'
        ? `${drawVerb(player, count)} from the Wild Draw Four.`
        : `${drawVerb(player, count)}.`,
      'bad',
    ],
  ])

  const afterIndex = nextIndex(next, playerIndex)
  return {
    ...next,
    pendingDraw: null,
    pendingWild4: null,
    colorChoice: null,
    drawnCardId: null,
    turnPhase: 'idle',
    currentPlayer: afterIndex,
    uno: next.uno && next.uno.playerIndex === playerIndex ? null : next.uno,
    tick: next.tick + 1,
  }
}

export type Wild4Response = 'accept' | 'challenge'

export function respondWild4(
  state: GameState,
  playerIndex: number,
  response: Wild4Response,
  now: number,
  rng: Rng = Math.random,
): GameState {
  const pending = state.pendingWild4
  if (
    state.phase !== 'playing' ||
    state.turnPhase !== 'wild4Response' ||
    !pending ||
    pending.target !== playerIndex ||
    playerIndex !== state.currentPlayer
  ) {
    return state
  }

  const challenger = state.players[playerIndex]
  const offender = state.players[pending.offender]

  // House rules without strict Wild +4 do not allow challenges. Treat an
  // accidental challenge as an accept instead of charging the challenger.
  if (!state.settings.strictWild4 && response === 'challenge') {
    return takePendingDraw(state, playerIndex, now, rng)
  }

  if (response === 'accept') {
    return takePendingDraw(state, playerIndex, now, rng)
  }

  const offenderHeldColor = hasColorMatch(offender.hand, pending.previousColor)
  const guilty = state.settings.strictWild4 && offenderHeldColor

  if (guilty) {
    let next = giveCards(state, pending.offender, 4, rng).state
    next = appendLogs(next, [
      [
        challenger.isHuman
          ? `You challenged! ${offender.name} was holding a ${pending.previousColor} card — ${drawVerb(offender, 4)}.`
          : offender.isHuman
            ? `${challenger.name} challenged! You were holding a ${pending.previousColor} card — you draw 4.`
            : `${challenger.name} challenged! ${offender.name} was holding a ${pending.previousColor} card — ${offender.name} draws 4.`,
        'bad',
      ],
    ])
    return {
      ...next,
      pendingDraw: null,
      pendingWild4: null,
      currentPlayer: playerIndex,
      turnPhase: 'chooseColor',
      colorChoice: { playerIndex, cardId: null, source: 'challenge' },
      drawnCardId: null,
      tick: next.tick + 1,
    }
  }

  const penalty = (state.pendingDraw?.count ?? 4) + 2
  let next = giveCards(state, playerIndex, penalty, rng).state
  next = clearUnoAfterDraw(next, playerIndex, penalty)
  next = appendLogs(next, [
    [
      challenger.isHuman
        ? `You challenged but the Wild Draw Four was legal — you draw ${penalty} cards.`
        : `${challenger.name} challenged but the Wild Draw Four was legal — ${challenger.name} draws ${penalty} cards.`,
      'bad',
    ],
  ])

  return {
    ...next,
    pendingDraw: null,
    pendingWild4: null,
    drawnCardId: null,
    turnPhase: 'idle',
    currentPlayer: nextIndex(next, playerIndex),
    uno: next.uno && next.uno.playerIndex === playerIndex ? null : next.uno,
    tick: next.tick + 1,
  }
}

// ---------------------------------------------------------------------------
// UNO
// ---------------------------------------------------------------------------

export function declareUno(state: GameState, playerIndex: number, now: number): GameState {
  const player = state.players[playerIndex]
  if (!player || state.phase !== 'playing') return state

  const isMyTurn = state.currentPlayer === playerIndex
  const hasTwo = player.hand.length === 2 && isMyTurn && (state.turnPhase === 'idle' || state.turnPhase === 'drawn')
  const caughtWindow = state.uno?.playerIndex === playerIndex && !state.uno.called && now <= state.uno.expiresAt

  if (caughtWindow) {
    return appendLog(
      {
        ...state,
        uno: { playerIndex, called: true, expiresAt: state.uno!.expiresAt },
        tick: state.tick + 1,
      },
      player.isHuman ? 'You called UNO in time!' : `${player.name} called UNO in time!`,
      'good',
    )
  }

  if (hasTwo && !state.unoArmed) {
    return appendLog(
      { ...state, unoArmed: true, tick: state.tick + 1 },
      player.isHuman ? `You're ready to call UNO.` : `${player.name} is ready to call UNO.`,
      'human',
    )
  }

  return state
}

export function catchUno(state: GameState, catcherIndex: number, now: number, rng: Rng = Math.random): GameState {
  const uno = state.uno
  if (!uno || uno.called) return state
  if (now > uno.expiresAt + 700) return state

  const offender = state.players[uno.playerIndex]
  const catcher = state.players[catcherIndex]
  const result = giveCards(state, uno.playerIndex, 2, rng)
  const next = appendLogs(result.state, [
    [
      `${catcher.isHuman ? 'You caught' : `${catcher.name} caught`} ${
        offender.isHuman ? 'you' : offender.name
      } without UNO — ${drawVerb(offender, 2)}!`,
      'bad',
    ],
  ])
  return {
    ...next,
    uno: null,
    unoArmed: false,
    tick: next.tick + 1,
  }
}

/** Called by the timer when an uncalled UNO window expires. */
export function resolveUnoTimeout(state: GameState, now: number, rng: Rng = Math.random): GameState {
  const uno = state.uno
  if (!uno || uno.called || now < uno.expiresAt) return state

  const player = state.players[uno.playerIndex]
  if (!player.isHuman) {
    return { ...state, uno: { ...uno, called: true } }
  }

  const result = giveCards(state, uno.playerIndex, 2, rng)
  const next = appendLogs(result.state, [
    [`You forgot to call UNO — your opponents catch it and you draw 2 cards!`, 'bad'],
  ])
  return { ...next, uno: null, unoArmed: false, tick: next.tick + 1 }
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export type SortMode = 'color' | 'value'

const KIND_ORDER: Record<string, number> = {
  number: 0,
  skip: 1,
  reverse: 2,
  draw2: 3,
  wild: 4,
  wild4: 5,
}

export function sortHand(state: GameState, playerIndex: number, mode: SortMode): GameState {
  const players = state.players.map((player, index) => {
    if (index !== playerIndex) return player
    const hand = [...player.hand].sort((a, b) => {
      if (mode === 'color') {
        const colorA = a.color === 'wild' ? 'z' : a.color
        const colorB = b.color === 'wild' ? 'z' : b.color
        if (colorA !== colorB) return colorA.localeCompare(colorB)
      }
      if (a.kind === 'number' && b.kind === 'number' && a.value !== b.value) {
        return (a.value ?? 0) - (b.value ?? 0)
      }
      const kindDiff = (KIND_ORDER[a.kind] ?? 9) - (KIND_ORDER[b.kind] ?? 9)
      if (kindDiff !== 0) return kindDiff
      return a.id.localeCompare(b.id)
    })
    return { ...player, hand }
  })
  return { ...state, players, tick: state.tick + 1 }
}

export function colorCounts(hand: Card[]): Record<CardColor, number> {
  const counts = { red: 0, yellow: 0, green: 0, blue: 0 }
  for (const card of hand) {
    if (card.color !== 'wild') counts[card.color] += 1
  }
  return counts
}

export function bestColorFor(hand: Card[], rng: Rng = Math.random): CardColor {
  const counts = colorCounts(hand)
  let best: CardColor = COLORS[Math.floor(rng() * COLORS.length)]
  let bestCount = -1
  for (const color of COLORS) {
    if (counts[color] > bestCount) {
      bestCount = counts[color]
      best = color
    }
  }
  return best
}

export function cardPointsFor(card: Card): number {
  return cardPoints(card)
}
