import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { startRound } from '../game/engine'
import { DEFAULT_SETTINGS } from '../game/types'
import { ChallengeModal, ColorPickerModal, MatchSummaryModal, RoundSummaryModal } from './Modals'

function baseState() {
  return startRound({
    settings: { ...DEFAULT_SETTINGS, playerCount: 3 },
    round: 1,
    starter: 0,
    rng: Math.random,
  })
}

describe('modal rendering', () => {
  it('renders the color picker', () => {
    const html = renderToStaticMarkup(<ColorPickerModal open source="hand" onChoose={() => {}} />)
    expect(html).toContain('Choose a color')
    expect(html).toContain('Red')
    expect(html).toContain('Blue')
  })

  it('renders the wild draw four challenge dialog with stack options', () => {
    const state = {
      ...baseState(),
      turnPhase: 'wild4Response' as const,
      currentPlayer: 0,
      pendingDraw: { count: 4, source: 'wild4' as const, causePlayer: 1 },
      pendingWild4: {
        offender: 1,
        target: 0,
        cardId: 'x',
        previousColor: 'red' as const,
        chosenColor: 'green' as const,
      },
    }
    const html = renderToStaticMarkup(
      <ChallengeModal state={state} stackableIds={[]} onRespond={() => {}} onStack={() => {}} />,
    )
    expect(html).toContain('Wild Draw Four!')
    expect(html).toContain('Accept +4')
    expect(html).toContain('Challenge')
  })

  it('renders the round summary with the breakdown', () => {
    const state = {
      ...baseState(),
      phase: 'roundOver' as const,
      roundResult: {
        winnerIndex: 0,
        points: 57,
        breakdown: [
          { playerIndex: 1, cards: 3, points: 7 },
          { playerIndex: 2, cards: 2, points: 50 },
        ],
      },
    }
    const html = renderToStaticMarkup(<RoundSummaryModal state={state} onNext={() => {}} onQuit={() => {}} />)
    expect(html).toContain('wins the round')
    expect(html).toContain('57')
    expect(html).toContain('Next round')
  })

  it('renders the match summary with final ranking', () => {
    const state = {
      ...baseState(),
      phase: 'matchOver' as const,
      matchWinner: 0,
      players: baseState().players.map((player, index) =>
        index === 0 ? { ...player, score: 520, roundsWon: 2 } : { ...player, score: 120, roundsWon: 1 },
      ),
    }
    const html = renderToStaticMarkup(<MatchSummaryModal state={state} onRematch={() => {}} onQuit={() => {}} />)
    expect(html).toContain('wins!')
    expect(html).toContain('520')
    expect(html).toContain('Rematch')
  })
})
