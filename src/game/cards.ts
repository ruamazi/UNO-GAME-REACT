import { COLORS, type Card, type CardColor, type CardKind } from './types'

type Rng = () => number

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function makeCard(color: CardColor | 'wild', kind: CardKind, copy: string, value?: number): Card {
  const suffix = value !== undefined ? `-${value}-${copy}` : `-${copy}`
  return { id: `${color}-${kind}${suffix}`, color, kind, value }
}

/** Builds the standard 108-card UNO deck. */
export function createDeck(): Card[] {
  const deck: Card[] = []
  for (const color of COLORS) {
    deck.push(makeCard(color, 'number', 'a', 0))
    for (let value = 1; value <= 9; value++) {
      deck.push(makeCard(color, 'number', 'a', value))
      deck.push(makeCard(color, 'number', 'b', value))
    }
    deck.push(makeCard(color, 'skip', 'a'), makeCard(color, 'skip', 'b'))
    deck.push(makeCard(color, 'reverse', 'a'), makeCard(color, 'reverse', 'b'))
    deck.push(makeCard(color, 'draw2', 'a'), makeCard(color, 'draw2', 'b'))
  }
  for (let i = 0; i < 4; i++) {
    deck.push(makeCard('wild', 'wild', `${i}`))
    deck.push(makeCard('wild', 'wild4', `${i}`))
  }
  return deck
}

/** Point value used when scoring the cards left in opponents' hands. */
export function cardPoints(card: Card): number {
  switch (card.kind) {
    case 'number':
      return card.value ?? 0
    case 'skip':
    case 'reverse':
    case 'draw2':
      return 20
    case 'wild':
    case 'wild4':
      return 50
  }
}

export function handPoints(hand: Card[]): number {
  return hand.reduce((total, card) => total + cardPoints(card), 0)
}

const COLOR_NAMES: Record<CardColor, string> = {
  red: 'Red',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
}

export function colorName(color: CardColor): string {
  return COLOR_NAMES[color]
}

/** Human readable name, e.g. "Red 7" or "Wild Draw Four". */
export function cardName(card: Card): string {
  const prefix = card.color === 'wild' ? '' : `${COLOR_NAMES[card.color]} `
  switch (card.kind) {
    case 'number':
      return `${prefix}${card.value}`
    case 'skip':
      return `${prefix}Skip`
    case 'reverse':
      return `${prefix}Reverse`
    case 'draw2':
      return `${prefix}Draw Two`
    case 'wild':
      return 'Wild'
    case 'wild4':
      return 'Wild Draw Four'
  }
}

/** Short glyph for the card corners. */
export function cardGlyph(card: Card): string {
  switch (card.kind) {
    case 'number':
      return String(card.value)
    case 'skip':
      return '⊘'
    case 'reverse':
      return '⇄'
    case 'draw2':
      return '+2'
    case 'wild':
      return '★'
    case 'wild4':
      return '+4'
  }
}
