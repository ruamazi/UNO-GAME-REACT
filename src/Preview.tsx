import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ChallengeModal, MatchSummaryModal, RoundSummaryModal } from './components/Modals'
import { startRound } from './game/engine'
import { DEFAULT_SETTINGS, type GameState } from './game/types'

function fixture(): GameState {
  return startRound({ settings: { ...DEFAULT_SETTINGS, playerCount: 3 }, round: 2, starter: 1, rng: Math.random })
}

function Preview() {
  const [mode, setMode] = useState<'challenge' | 'round' | 'match'>('challenge')
  const base = fixture()

  return (
    <div className="table-felt min-h-screen p-4">
      <div className="flex gap-2">
        {(['challenge', 'round', 'match'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold uppercase text-white"
          >
            {value}
          </button>
        ))}
      </div>

      {mode === 'challenge' && (
        <ChallengeModal
          state={{
            ...base,
            turnPhase: 'wild4Response',
            currentPlayer: 0,
            pendingDraw: { count: 4, source: 'wild4', causePlayer: 1 },
            pendingWild4: {
              offender: 1,
              target: 0,
              cardId: 'x',
              previousColor: 'green',
              chosenColor: 'blue',
            },
            players: base.players.map((player, index) =>
              index === 0
                ? { ...player, hand: base.players[0].hand.slice(0, 4) }
                : player,
            ),
          }}
          stackableIds={base.players[0].hand.filter((card) => card.kind === 'draw2' || card.kind === 'wild4').map((c) => c.id)}
          onRespond={() => {}}
          onStack={() => {}}
        />
      )}

      {mode === 'round' && (
        <RoundSummaryModal
          state={{
            ...base,
            phase: 'roundOver',
            roundResult: {
              winnerIndex: 1,
              points: 63,
              breakdown: [
                { playerIndex: 0, cards: 4, points: 13 },
                { playerIndex: 2, cards: 3, points: 50 },
              ],
            },
            players: base.players.map((player, index) => (index === 1 ? { ...player, score: 118, roundsWon: 2 } : player)),
          }}
          onNext={() => {}}
          onQuit={() => {}}
        />
      )}

      {mode === 'match' && (
        <MatchSummaryModal
          state={{
            ...base,
            phase: 'matchOver',
            matchWinner: 0,
            players: base.players.map((player, index) =>
              index === 0 ? { ...player, score: 503, roundsWon: 3 } : { ...player, score: 240, roundsWon: 1 },
            ),
          }}
          onRematch={() => {}}
          onQuit={() => {}}
        />
      )}
    </div>
  )
}

createRoot(document.getElementById('preview')!).render(<Preview />)
