import { useState } from 'react'
import { Layers, RotateCcw, RotateCw } from 'lucide-react'
import { topDiscard } from '../game/engine'
import { colorName } from '../game/cards'
import type { CardColor, GameState } from '../game/types'
import { CardBack, CardView } from './CardView'
import { Chip } from './ui'

const COLOR_RING: Record<CardColor, string> = {
  red: 'bg-uno-red',
  yellow: 'bg-uno-yellow',
  green: 'bg-uno-green',
  blue: 'bg-uno-blue',
}

export function CenterPile({
  state,
  canDraw,
  onDraw,
}: {
  state: GameState
  canDraw: boolean
  onDraw: () => void
}) {
  const top = topDiscard(state)
  const [deckShake, setDeckShake] = useState(false)

  const handleDraw = () => {
    setDeckShake(true)
    window.setTimeout(() => setDeckShake(false), 450)
    onDraw()
  }

  return (
    <div className="relative flex items-center justify-center gap-6 sm:gap-10">
      {/* deck */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={canDraw ? handleDraw : undefined}
          disabled={!canDraw}
          aria-label={`Draw pile, ${state.deck.length} cards`}
          className={`relative ${deckShake ? 'animate-shake' : ''} ${canDraw ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <div className="absolute left-1 top-1 opacity-60">
            <CardBack size="md" />
          </div>
          <div className="absolute left-0.5 top-0.5 opacity-80">
            <CardBack size="md" />
          </div>
          <CardBack
            size="md"
            className={`relative ${canDraw ? 'transition-transform hover:-translate-y-1' : ''}`}
          />
          {state.deck.length === 0 && (
            <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 text-[10px] font-bold uppercase tracking-wider text-white/80">
              empty
            </span>
          )}
        </button>
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/50">
          <Layers size={11} /> {state.deck.length}
        </span>
      </div>

      {/* direction + color indicator */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/70">
          {state.direction === 1 ? (
            <RotateCw size={22} className="animate-[spin_9s_linear_infinite]" />
          ) : (
            <RotateCcw size={22} className="animate-[spin_9s_linear_infinite_reverse]" />
          )}
        </div>
        <span className={`h-3 w-10 rounded-full ring-2 ring-white/20 ${COLOR_RING[state.currentColor]}`} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
          {colorName(state.currentColor)}
        </span>
        {state.pendingDraw && state.pendingDraw.count > 0 && (
          <Chip className="border-uno-red/50 bg-uno-red/25 text-white">
            pending +{state.pendingDraw.count}
          </Chip>
        )}
      </div>

      {/* discard */}
      <div className="relative flex flex-col items-center gap-2">
        <div className="relative h-[6.44rem] w-[4.6rem]">
          {state.discard.slice(-3, -1).map((card, index) => (
            <div
              key={card.id}
              className="absolute inset-0"
              style={{ transform: `rotate(${index === 0 ? -9 : 7}deg) translateY(${index === 0 ? 2 : -1}px)` }}
            >
              <CardView card={card} size="md" dimmed />
            </div>
          ))}
          <div key={top.id} className="animate-discard-pop absolute inset-0">
            <CardView
              card={top}
              size="md"
              className="shadow-[0_0_24px_rgba(0,0,0,0.5)]"
              title={`Top card: ${top.kind === 'wild' ? 'Wild' : ''}`}
            />
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">discard</span>
      </div>
    </div>
  )
}
