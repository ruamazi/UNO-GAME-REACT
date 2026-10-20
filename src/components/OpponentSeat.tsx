import { AlertCircle, Crown } from 'lucide-react'
import type { Player } from '../game/types'
import { CardBack } from './CardView'

export function OpponentSeat({
  player,
  isCurrent,
  isNext,
  unoUncalled,
  onCatch,
  thinking,
}: {
  player: Player
  isCurrent: boolean
  isNext?: boolean
  unoUncalled?: boolean
  onCatch?: () => void
  thinking?: boolean
}) {
  const visibleBacks = Math.min(player.hand.length, 7)
  const behind = player.hand.length - visibleBacks

  return (
    <div
      className={`relative flex flex-col items-center gap-1.5 rounded-2xl px-2.5 py-2 transition-all duration-300 sm:px-3 ${
        isCurrent ? 'bg-uno-yellow/12 ring-1 ring-uno-yellow/50' : 'bg-black/15 ring-1 ring-white/5'
      }`}
    >
      {unoUncalled && (
        <button
          type="button"
          onClick={onCatch}
          className="animate-pulse-ring absolute -top-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-uno-red px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-lg transition-transform hover:scale-105"
        >
          Catch UNO!
        </button>
      )}

      <div className="flex items-center gap-2">
        <div className="relative">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-lg sm:h-10 sm:w-10 sm:text-xl ${
              isCurrent ? 'border-uno-yellow bg-uno-yellow/20' : 'border-white/20 bg-black/30'
            }`}
          >
            {player.avatar}
          </div>
          {player.roundsWon > 0 && (
            <span className="absolute -bottom-1 -right-1 flex items-center gap-0.5 rounded-full bg-uno-yellow px-1 text-[9px] font-black text-uno-black">
              <Crown size={8} /> {player.roundsWon}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="max-w-[7rem] truncate text-xs font-bold text-white sm:text-sm">{player.name}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/50">
            {player.score} pts
            {thinking && <span className="ml-1 text-uno-yellow">thinking…</span>}
          </p>
        </div>
      </div>

      <div className="flex h-5 items-center">
        {Array.from({ length: visibleBacks }).map((_, index) => (
          <div key={index} className="-ml-2.5 origin-bottom scale-[0.56] first:ml-0 sm:scale-[0.72]">
            <CardBack size="xs" />
          </div>
        ))}
        {behind > 0 && <span className="ml-1 text-[10px] font-bold text-white/60">+{behind}</span>}
        {player.hand.length === 0 && <span className="text-[10px] font-bold uppercase text-white/40">no cards</span>}
      </div>

      <div className="absolute -bottom-2 flex items-center gap-1">
        {player.hand.length === 1 && player.unoCalled && (
          <span className="rounded-full bg-uno-red px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow">
            UNO!
          </span>
        )}
        {isNext && !isCurrent && (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/50">
            next
          </span>
        )}
        {unoUncalled && <AlertCircle size={12} className="text-uno-red" />}
      </div>
    </div>
  )
}
