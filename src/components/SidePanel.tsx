import { useEffect, useRef } from 'react'
import { History, ListOrdered, X } from 'lucide-react'
import type { GameState, LogTone } from '../game/types'

const TONE: Record<LogTone, string> = {
  info: 'text-white/65',
  good: 'text-emerald-300',
  bad: 'text-red-300',
  human: 'text-sky-300',
  bot: 'text-white/80',
}

export function SidePanel({
  open,
  tab,
  state,
  onTab,
  onClose,
}: {
  open: boolean
  tab: 'log' | 'scores'
  state: GameState
  onTab: (tab: 'log' | 'scores') => void
  onClose: () => void
}) {
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && tab === 'log' && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [open, tab, state.log])

  if (!open) return null

  const ranked = [...state.players].sort((a, b) => b.score - a.score)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close panel" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="glass animate-slide-in-right relative flex h-full w-full max-w-sm flex-col rounded-l-2xl">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 p-3">
          <div className="flex rounded-xl border border-white/10 bg-black/25 p-1">
            <button
              type="button"
              onClick={() => onTab('log')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                tab === 'log' ? 'bg-white/15 text-white' : 'text-white/55 hover:text-white'
              }`}
            >
              <History size={13} /> Log
            </button>
            <button
              type="button"
              onClick={() => onTab('scores')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                tab === 'scores' ? 'bg-white/15 text-white' : 'text-white/55 hover:text-white'
              }`}
            >
              <ListOrdered size={13} /> Scores
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {tab === 'log' ? (
          <div ref={logRef} className="thin-scroll flex-1 space-y-2 overflow-y-auto p-4">
            {state.log.map((entry) => (
              <p key={entry.id} className={`text-[13px] leading-snug ${TONE[entry.tone]}`}>
                {entry.text}
              </p>
            ))}
          </div>
        ) : (
          <div className="thin-scroll flex-1 space-y-3 overflow-y-auto p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-white/45">
              First to {state.settings.targetScore} points
            </p>
            {ranked.map((player, rank) => {
              const progress = Math.min(100, (player.score / state.settings.targetScore) * 100)
              return (
                <div key={player.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-bold text-white">
                      <span className="w-4 text-xs font-semibold text-white/40">#{rank + 1}</span>
                      <span className="text-lg">{player.avatar}</span>
                      {player.name}
                    </span>
                    <span className="text-sm font-bold text-uno-yellow">{player.score}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-uno-green to-uno-yellow transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-white/50">
                    {player.hand.length} cards in hand · {player.roundsWon} round{player.roundsWon === 1 ? '' : 's'} won
                  </p>
                </div>
              )
            })}
            {state.roundResult && (
              <div className="rounded-xl border border-uno-yellow/25 bg-uno-yellow/10 p-3 text-xs text-white/70">
                Last round: {state.players[state.roundResult.winnerIndex].name} scored {state.roundResult.points} points.
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  )
}
