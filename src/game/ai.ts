import { bestColorFor, legalCards, nextIndex } from './engine'
import { colorCounts } from './engine'
import type { Card, CardColor, GameState } from './types'
import type { Rng } from './engine'

export type BotAction =
  | { type: 'play'; cardId: string; color?: CardColor }
  | { type: 'draw' }
  | { type: 'pass' }
  | { type: 'takeDraw' }
  | { type: 'chooseColor'; color: CardColor }
  | { type: 'respondWild4'; response: 'accept' | 'challenge' }

function dangerAhead(state: GameState, playerIndex: number): boolean {
  const next = state.players[nextIndex(state, playerIndex)]
  return next.hand.length <= 2
}

function scoreCard(state: GameState, playerIndex: number, card: Card, rng: Rng): number {
  const me = state.players[playerIndex]
  const counts = colorCounts(me.hand)
  const nextDanger = dangerAhead(state, playerIndex)
  const isSharp = state.settings.difficulty === 'sharp'

  let score = rng() * 0.5

  if (me.hand.length === 1) return 100000

  switch (card.kind) {
    case 'number':
      score += 2 + (card.value ?? 0) * 0.4
      break
    case 'draw2':
      score += 6 + (nextDanger ? 16 : 0)
      break
    case 'skip':
      score += 5 + (nextDanger ? 13 : 0)
      break
    case 'reverse':
      score += 4 + (nextDanger ? (state.players.length === 2 ? 15 : 5) : 0)
      break
    case 'wild':
      score += nextDanger ? 9 : -5
      break
    case 'wild4':
      score += nextDanger ? 18 : -4
      break
  }

  if (card.color !== 'wild') {
    const sameColor = counts[card.color]
    score += sameColor === 1 ? -1.2 : 0.6
    if (isSharp) {
      // Keep flexible colors: prefer playing from the color we hold most of.
      score += Math.min(2, sameColor) * 0.35
    }
  }

  // Duplicates are expendable.
  const duplicates = me.hand.filter(
    (other) =>
      other.id !== card.id &&
      ((other.kind === 'number' && card.kind === 'number' && other.value === card.value && other.color === card.color) ||
        (other.kind === card.kind && other.kind !== 'number' && other.color === card.color)),
  ).length
  score += duplicates * 0.8

  // Reaching one card is strong but not worth burning a wild when a number will do.
  if (me.hand.length === 2 && card.kind !== 'wild' && card.kind !== 'wild4') score += 4
  if (me.hand.length === 2 && card.color !== 'wild') score += 2

  return score
}

function pickBestCard(state: GameState, playerIndex: number, cards: Card[], rng: Rng): Card {
  let best = cards[0]
  let bestScore = -Infinity
  for (const card of cards) {
    const score = scoreCard(state, playerIndex, card, rng)
    if (score > bestScore) {
      bestScore = score
      best = card
    }
  }
  return best
}

function playAction(state: GameState, card: Card): BotAction {
  if (card.color === 'wild') {
    return { type: 'play', cardId: card.id, color: bestColorFor(state.players[state.currentPlayer].hand) }
  }
  return { type: 'play', cardId: card.id }
}

function decideDrawnCard(state: GameState, playerIndex: number, card: Card, rng: Rng): BotAction {
  const me = state.players[playerIndex]
  const nextDanger = dangerAhead(state, playerIndex)
  const isWild = card.color === 'wild'

  if (me.hand.length === 2) return playAction(state, card)
  if (!isWild) return playAction(state, card)

  if (card.kind === 'wild4' && nextDanger) return playAction(state, card)
  if (me.hand.length >= 4 || rng() < 0.35) return playAction(state, card)
  return { type: 'pass' }
}

/** Decides what the bot at `playerIndex` should do in the current state. */
export function decideBotAction(state: GameState, playerIndex: number, rng: Rng = Math.random): BotAction | null {
  if (state.phase !== 'playing' || playerIndex !== state.currentPlayer) return null

  const me = state.players[playerIndex]

  // 1. Color choice (wild in hand, starting wild, or after a successful challenge)
  if (state.colorChoice && state.colorChoice.playerIndex === playerIndex) {
    return { type: 'chooseColor', color: bestColorFor(me.hand, rng) }
  }

  // 2. Responding to a Wild Draw Four
  if (state.turnPhase === 'wild4Response' && state.pendingWild4?.target === playerIndex) {
    const stackables = legalCards(state, playerIndex)
    if (state.settings.stacking && stackables.length > 0) {
      const pendingCount = state.pendingDraw?.count ?? 4
      const shouldStack = pendingCount >= 6 || me.hand.length > 3 || rng() < 0.55
      if (shouldStack) {
        const drawTwos = stackables.filter((card) => card.kind === 'draw2')
        const wild4s = stackables.filter((card) => card.kind === 'wild4')
        const card = pendingCount >= 4 && wild4s.length > 0 ? wild4s[0] : (drawTwos[0] ?? wild4s[0])
        return playAction(state, card)
      }
    }
    const offender = state.players[state.pendingWild4.offender]
    if (!state.settings.strictWild4) return { type: 'respondWild4', response: 'accept' }
    const base = state.settings.difficulty === 'sharp' ? 0.34 : 0.14
    const suspicion = Math.min(0.26, offender.hand.length * 0.02)
    return { type: 'respondWild4', response: rng() < base + suspicion ? 'challenge' : 'accept' }
  }

  // 3. Facing a pending draw (stacking enabled)
  if (state.pendingDraw && state.pendingDraw.count > 0) {
    const stackables = legalCards(state, playerIndex)
    if (state.settings.stacking && stackables.length > 0) {
      const drawTwos = stackables.filter((card) => card.kind === 'draw2')
      const card = drawTwos[0] ?? stackables[0]
      return playAction(state, card)
    }
    return { type: 'takeDraw' }
  }

  // 4. Just drew a card
  if (state.turnPhase === 'drawn') {
    const drawn = me.hand.find((card) => card.id === state.drawnCardId)
    if (!drawn) return { type: 'pass' }
    const playable = legalCards(state, playerIndex).some((card) => card.id === drawn.id)
    if (!playable) return { type: 'pass' }
    return decideDrawnCard(state, playerIndex, drawn, rng)
  }

  // 5. Normal turn
  const playable = legalCards(state, playerIndex)
  if (playable.length === 0) return { type: 'draw' }

  // Avoid illegal Wild Draw Four temptation entirely handled by legalCards().
  const card = pickBestCard(state, playerIndex, playable, rng)
  return playAction(state, card)
}
