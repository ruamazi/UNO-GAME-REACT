import type { Card } from '../game/types'
import { CardView } from './CardView'

function overlapFor(count: number): number {
  if (count <= 5) return -6
  if (count <= 8) return -26
  if (count <= 12) return -38
  if (count <= 16) return -46
  return -50
}

export function Hand({
  cards,
  interactive,
  playableIds,
  highlightId,
  onPlay,
}: {
  cards: Card[]
  interactive: boolean
  playableIds: Set<string>
  highlightId?: string | null
  onPlay: (cardId: string) => void
}) {
  const overlap = overlapFor(cards.length)
  const mid = (cards.length - 1) / 2

  return (
    <div className="relative flex w-full justify-center">
      <div className="no-scrollbar flex max-w-full items-end justify-start overflow-x-auto px-6 pb-2 pt-6 sm:justify-center sm:px-4">
        <div className="flex origin-bottom scale-[0.82] items-end sm:scale-100">
          {cards.map((card, index) => {
            const rotation = (index - mid) * Math.min(2.3, 36 / Math.max(cards.length, 1))
            const lift = Math.abs(index - mid) ** 2 * 0.85
            const playable = playableIds.has(card.id)
            return (
              <div
                key={card.id}
                className="relative transition-transform"
                style={{
                  transform: `rotate(${rotation}deg) translateY(${lift}px)`,
                  transformOrigin: 'bottom center',
                  marginLeft: index === 0 ? 0 : overlap,
                  zIndex: index,
                }}
              >
                <CardView
                  card={card}
                  size="md"
                  playable={interactive ? playable : true}
                  dimmed={interactive && !playable}
                  selected={highlightId === card.id}
                  onClick={interactive ? () => onPlay(card.id) : undefined}
                  className={[
                    interactive && playable ? 'hover:-translate-y-5 hover:z-40 hover:scale-105' : '',
                    highlightId === card.id ? 'animate-glow-pulse' : '',
                    'animate-deal-in',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  title={
                    interactive
                      ? playable
                        ? 'Play this card'
                        : 'This card cannot be played right now'
                      : undefined
                  }
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
