import { describe, expect, it } from 'vitest'
import { createDeck, handPoints } from './cards'
import {
  beginPlay,
  catchUno,
  chooseColor,
  declareUno,
  drawCard,
  legalCards,
  nextIndex,
  resolveUnoTimeout,
  respondWild4,
  startRound,
  takePendingDraw,
} from './engine'
import { DEFAULT_SETTINGS, type Card, type CardColor, type CardKind, type GameState, type Player } from './types'

let cardSeq = 0
function card(color: CardColor | 'wild', kind: CardKind, value?: number): Card {
  cardSeq += 1
  return { id: `${color}-${kind}-${value ?? 'x'}-${cardSeq}`, color, kind, value }
}

function playersFromHands(hands: Card[][]): Player[] {
  return hands.map((hand, index) => ({
    id: index,
    name: index === 0 ? 'You' : `Bot ${index}`,
    avatar: '🤖',
    isHuman: index === 0,
    hand,
    score: 0,
    unoCalled: false,
    roundsWon: 0,
  }))
}

function stateWith(hands: Card[][], top: Card, overrides: Partial<GameState> = {}): GameState {
  return {
    phase: 'playing',
    settings: { ...DEFAULT_SETTINGS, playerCount: hands.length, strictWild4: true, stacking: false },
    players: playersFromHands(hands),
    deck: Array.from({ length: 20 }, (_, index) => card('green', 'number', (index % 9) + 1)),
    discard: [top],
    currentPlayer: 0,
    direction: 1,
    currentColor: top.color === 'wild' ? 'red' : top.color,
    turnPhase: 'idle',
    pendingDraw: null,
    pendingWild4: null,
    colorChoice: null,
    drawnCardId: null,
    uno: null,
    unoArmed: false,
    log: [],
    logSeq: 0,
    round: 1,
    roundResult: null,
    matchWinner: null,
    lastPlayedCardId: null,
    tick: 0,
    ...overrides,
  }
}

const now = () => 1_000_000

describe('deck', () => {
  it('builds the standard 108-card UNO deck', () => {
    const deck = createDeck()
    expect(deck).toHaveLength(108)
    expect(deck.filter((c) => c.kind === 'wild')).toHaveLength(4)
    expect(deck.filter((c) => c.kind === 'wild4')).toHaveLength(4)
    expect(deck.filter((c) => c.kind === 'draw2')).toHaveLength(8)
    expect(deck.filter((c) => c.kind === 'skip')).toHaveLength(8)
    expect(deck.filter((c) => c.kind === 'reverse')).toHaveLength(8)
    expect(deck.filter((c) => c.kind === 'number' && c.value === 0)).toHaveLength(4)
    expect(deck.filter((c) => c.kind === 'number' && c.value === 7)).toHaveLength(8)
    for (const color of ['red', 'yellow', 'green', 'blue'] as const) {
      expect(deck.filter((c) => c.color === color)).toHaveLength(25)
    }
  })

  it('scores cards by the official values', () => {
    expect(handPoints([card('red', 'number', 9), card('blue', 'skip'), card('wild', 'wild4')])).toBe(9 + 20 + 50)
  })
})

describe('startRound', () => {
  it('deals seven cards to every player', () => {
    const state = startRound({ settings: { ...DEFAULT_SETTINGS, playerCount: 3 }, round: 1, starter: 0, rng: Math.random })
    expect(state.players).toHaveLength(3)
    for (const player of state.players) expect(player.hand).toHaveLength(7)
    expect(state.discard).toHaveLength(1)
    expect(state.discard[0].kind).not.toBe('wild4')
    const total = state.players.reduce((sum, p) => sum + p.hand.length, 0) + state.deck.length + state.discard.length
    expect(total).toBe(108)
  })
})

describe('turn flow', () => {
  it('advances the turn after a number card and matches by color or number', () => {
    const state = stateWith(
      [[card('red', 'number', 5), card('blue', 'number', 9)], [card('red', 'number', 4)], [card('green', 'number', 8)]],
      card('red', 'number', 9),
    )
    const legal = legalCards(state, 0)
    expect(legal.map((c) => c.id)).toEqual(state.players[0].hand.map((c) => c.id))
    const next = beginPlay(state, 0, state.players[0].hand[0].id, now())
    expect(next.currentPlayer).toBe(1)
    expect(next.currentColor).toBe('red')
    expect(next.discard).toHaveLength(2)
  })

  it('rejects cards that do not follow the top card', () => {
    const blueCard = card('blue', 'number', 9)
    const state = stateWith([[blueCard], [card('red', 'number', 4)]], card('red', 'number', 3))
    expect(legalCards(state, 0)).toHaveLength(0)
    expect(beginPlay(state, 0, blueCard.id, now())).toBe(state)
  })

  it('skip makes the next player lose a turn', () => {
    const state = stateWith(
      [[card('red', 'skip')], [card('red', 'number', 4)], [card('red', 'number', 8)]],
      card('red', 'number', 3),
    )
    const next = beginPlay(state, 0, state.players[0].hand[0].id, now())
    expect(next.currentPlayer).toBe(2)
  })

  it('reverse flips direction (and acts as skip with two players)', () => {
    const three = stateWith(
      [[card('red', 'reverse')], [card('red', 'number', 4)], [card('red', 'number', 8)]],
      card('red', 'number', 3),
    )
    const reversed = beginPlay(three, 0, three.players[0].hand[0].id, now())
    expect(reversed.direction).toBe(-1)
    expect(reversed.currentPlayer).toBe(2)

    const two = stateWith([[card('red', 'reverse')], [card('red', 'number', 4)]], card('red', 'number', 3))
    const skip = beginPlay(two, 0, two.players[0].hand[0].id, now())
    expect(skip.currentPlayer).toBe(0)
  })

  it('draw two forces the next player to draw and be skipped', () => {
    const state = stateWith(
      [[card('red', 'draw2'), card('red', 'number', 1)], [card('red', 'number', 4)], [card('red', 'number', 8)]],
      card('red', 'number', 3),
    )
    const pending = beginPlay(state, 0, state.players[0].hand[0].id, now())
    expect(pending.pendingDraw?.count).toBe(2)
    expect(pending.currentPlayer).toBe(1)
    const resolved = takePendingDraw(pending, 1, now())
    expect(resolved.players[1].hand).toHaveLength(3)
    expect(resolved.pendingDraw).toBeNull()
    expect(resolved.currentPlayer).toBe(2)
  })

  it('stacks draw cards when the house rule is enabled', () => {
    const state = stateWith(
      [[card('red', 'draw2'), card('red', 'number', 1)], [card('blue', 'draw2'), card('blue', 'number', 5)], [card('green', 'number', 8)]],
      card('red', 'number', 3),
      { settings: { ...DEFAULT_SETTINGS, playerCount: 3, stacking: true } },
    )
    const pending = beginPlay(state, 0, state.players[0].hand[0].id, now())
    expect(legalCards(pending, 1).map((c) => c.kind)).toEqual(['draw2'])
    const stacked = beginPlay(pending, 1, pending.players[1].hand[0].id, now())
    expect(stacked.pendingDraw?.count).toBe(4)
    expect(stacked.currentPlayer).toBe(2)
    const after = takePendingDraw(stacked, 2, now())
    expect(after.players[2].hand).toHaveLength(1 + 4)
  })

  it('require the drawn card to be played after drawing', () => {
    const state = stateWith([[card('red', 'number', 5), card('blue', 'number', 1)], [card('red', 'number', 4)]], card('green', 'number', 3))
    const drawn = drawCard(state, 0, now())
    expect(drawn.turnPhase).toBe('drawn')
    const legal = legalCards(drawn, 0)
    expect(legal).toHaveLength(1)
    expect(legal[0].id).toBe(drawn.drawnCardId)
    expect(beginPlay(drawn, 0, drawn.players[0].hand[0].id, now())).toBe(drawn)
  })

  it('reshuffles the discard pile when the deck runs out', () => {
    const state = stateWith([[card('red', 'number', 5)], [card('red', 'number', 4)]], card('red', 'number', 3), {
      deck: [],
      discard: [
        card('blue', 'number', 1),
        card('green', 'number', 2),
        card('yellow', 'number', 6),
        card('red', 'number', 3),
      ],
    })
    const drawn = drawCard(state, 0, now())
    expect(drawn.players[0].hand).toHaveLength(2)
    expect(drawn.discard).toHaveLength(1)
    expect(drawn.deck.length).toBeGreaterThan(0)
  })
})

describe('wild cards', () => {
  it('asks for a color before completing a wild play', () => {
    const wild = card('wild', 'wild')
    const state = stateWith([[wild, card('red', 'number', 2)], [card('red', 'number', 4)]], card('red', 'number', 3))
    const pendingColor = beginPlay(state, 0, wild.id, now())
    expect(pendingColor.colorChoice).toEqual({ playerIndex: 0, cardId: wild.id, source: 'hand' })
    expect(pendingColor.players[0].hand).toHaveLength(2)
    const played = chooseColor(pendingColor, 0, 'blue', now())
    expect(played.currentColor).toBe('blue')
    expect(played.players[0].hand).toHaveLength(1)
    expect(played.currentPlayer).toBe(1)
  })

  it('respects the strict Wild Draw Four rule', () => {
    const state = stateWith(
      [[card('wild', 'wild4'), card('red', 'number', 9)], [card('red', 'number', 4)]],
      card('red', 'number', 3),
    )
    const legal = legalCards(state, 0)
    expect(legal).toHaveLength(1)
    expect(legal[0].kind).toBe('number')

    const noColor = stateWith(
      [[card('wild', 'wild4'), card('blue', 'number', 9)], [card('red', 'number', 4)]],
      card('red', 'number', 3),
    )
    expect(legalCards(noColor, 0)).toHaveLength(1)
  })
})

describe('wild draw four challenge', () => {
  it('punishes the offender when the challenge succeeds', () => {
    const state = stateWith(
      [[card('wild', 'wild4'), card('red', 'number', 9)], [card('blue', 'number', 4)], [card('green', 'number', 2)]],
      card('wild', 'wild4'),
      {
        currentPlayer: 1,
        turnPhase: 'wild4Response',
        pendingDraw: { count: 4, source: 'wild4', causePlayer: 0 },
        pendingWild4: { offender: 0, target: 1, cardId: 'wild4-card', previousColor: 'red', chosenColor: 'green' },
      },
    )
    const challenged = respondWild4(state, 1, 'challenge', now())
    expect(challenged.players[0].hand).toHaveLength(2 + 4)
    expect(challenged.currentPlayer).toBe(1)
    expect(challenged.turnPhase).toBe('chooseColor')
    const colored = chooseColor(challenged, 1, 'blue', now())
    expect(colored.currentColor).toBe('blue')
    expect(colored.turnPhase).toBe('idle')
  })

  it('penalizes a failed challenge with six cards', () => {
    const state = stateWith(
      [[card('wild', 'wild4'), card('blue', 'number', 9)], [card('blue', 'number', 4)]],
      card('red', 'number', 3),
      { currentColor: 'red' },
    )
    const played = chooseColor(beginPlay(state, 0, state.players[0].hand[0].id, now()), 0, 'green', now())
    const challenged = respondWild4(played, 1, 'challenge', now())
    expect(challenged.players[0].hand).toHaveLength(1)
    expect(challenged.players[1].hand).toHaveLength(1 + 6)
    expect(challenged.currentPlayer).toBe(0)
  })

  it('accepting the penalty draws the pending amount', () => {
    const state = stateWith(
      [[card('wild', 'wild4'), card('blue', 'number', 9)], [card('blue', 'number', 4)], [card('red', 'number', 1)]],
      card('red', 'number', 3),
    )
    const played = chooseColor(beginPlay(state, 0, state.players[0].hand[0].id, now()), 0, 'green', now())
    const accepted = respondWild4(played, 1, 'accept', now())
    expect(accepted.players[1].hand).toHaveLength(1 + 4)
    expect(accepted.currentPlayer).toBe(2)
  })

  it('treats a challenge as an accept when strict Wild +4 is disabled', () => {
    const state = stateWith(
      [[card('wild', 'wild4'), card('blue', 'number', 9)], [card('blue', 'number', 4)], [card('red', 'number', 1)]],
      card('red', 'number', 3),
      { settings: { ...DEFAULT_SETTINGS, playerCount: 3, strictWild4: false, stacking: false } },
    )
    const played = chooseColor(beginPlay(state, 0, state.players[0].hand[0].id, now()), 0, 'green', now())
    const accepted = respondWild4(played, 1, 'challenge', now())

    expect(accepted.players[1].hand).toHaveLength(1 + 4)
    expect(accepted.players[0].hand).toHaveLength(1)
    expect(accepted.pendingDraw).toBeNull()
    expect(accepted.pendingWild4).toBeNull()
    expect(accepted.currentPlayer).toBe(2)
  })
})

describe('uno', () => {
  it('allows catching a player who did not call UNO', () => {
    const state = stateWith(
      [[card('red', 'number', 5), card('red', 'number', 6)], [card('red', 'number', 4)]],
      card('red', 'number', 3),
    )
    const played = beginPlay(state, 0, state.players[0].hand[0].id, now())
    expect(played.uno?.called).toBe(false)
    const caught = catchUno({ ...played, currentPlayer: 0 }, 1, now() + 100)
    expect(caught.players[0].hand).toHaveLength(3)
    expect(caught.uno).toBeNull()
  })

  it('protects a player who armed UNO before playing', () => {
    const state = stateWith(
      [[card('red', 'number', 5), card('red', 'number', 6)], [card('red', 'number', 4)]],
      card('red', 'number', 3),
    )
    const armed = declareUno(state, 0, now())
    expect(armed.unoArmed).toBe(true)
    const played = beginPlay(armed, 0, armed.players[0].hand[0].id, now())
    expect(played.uno?.called).toBe(true)
    const caught = catchUno(played, 1, now() + 100)
    expect(caught.players[0].hand).toHaveLength(1)
  })

  it('issues the penalty when a human forgets and the window expires', () => {
    const state = stateWith(
      [[card('red', 'number', 5), card('red', 'number', 6)], [card('red', 'number', 4)]],
      card('red', 'number', 3),
    )
    const played = beginPlay(state, 0, state.players[0].hand[0].id, now())
    const expired = resolveUnoTimeout(played, now() + 10_000)
    expect(expired.players[0].hand).toHaveLength(3)
    expect(expired.uno).toBeNull()
  })
})

describe('scoring and match end', () => {
  it('awards the winner the points left in opponents hands', () => {
    const state = stateWith(
      [[card('red', 'number', 5)], [card('blue', 'number', 4), card('wild', 'wild')]],
      card('red', 'number', 3),
      { settings: { ...DEFAULT_SETTINGS, playerCount: 2, targetScore: 500 } },
    )
    const finished = beginPlay(state, 0, state.players[0].hand[0].id, now())
    expect(finished.phase).toBe('roundOver')
    expect(finished.roundResult?.points).toBe(4 + 50)
    expect(finished.players[0].score).toBe(54)
    expect(finished.matchWinner).toBeNull()
  })

  it('ends the match when the target score is reached', () => {
    const state = stateWith(
      [[card('red', 'number', 5)], [card('blue', 'number', 4)]],
      card('red', 'number', 3),
      { settings: { ...DEFAULT_SETTINGS, playerCount: 2, targetScore: 4 } },
    )
    const finished = beginPlay(state, 0, state.players[0].hand[0].id, now())
    expect(finished.phase).toBe('matchOver')
    expect(finished.matchWinner).toBe(0)
  })
})

describe('nextIndex', () => {
  it('wraps around in both directions', () => {
    const state = { players: playersFromHands([[], [], [], []]), direction: 1 as const }
    expect(nextIndex(state, 3)).toBe(0)
    expect(nextIndex({ ...state, direction: -1 }, 0)).toBe(3)
    expect(nextIndex(state, 0, 2)).toBe(2)
  })
})
