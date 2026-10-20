import type { CSSProperties } from 'react'
import { cardGlyph } from '../game/cards'
import type { Card, CardColor } from '../game/types'

export type CardSize = 'xs' | 'sm' | 'md' | 'lg'

const SIZE: Record<
  CardSize,
  { box: string; corner: string; glyph: string; oval: string; label: string }
> = {
  xs: {
    box: 'w-9 h-[3.1rem]',
    corner: 'text-[8px] leading-none px-[3px] py-[2px]',
    glyph: 'text-[13px]',
    oval: 'text-[11px]',
    label: 'text-[7px] tracking-widest',
  },
  sm: {
    box: 'w-13 h-[4.55rem]',
    corner: 'text-[11px] leading-none px-1 py-[3px]',
    glyph: 'text-xl',
    oval: 'text-base',
    label: 'text-[8px] tracking-widest',
  },
  md: {
    box: 'w-[4.6rem] h-[6.44rem]',
    corner: 'text-sm leading-none px-1.5 py-1',
    glyph: 'text-3xl',
    oval: 'text-2xl',
    label: 'text-[9px] tracking-widest',
  },
  lg: {
    box: 'w-[5.6rem] h-[7.84rem]',
    corner: 'text-base leading-none px-2 py-1.5',
    glyph: 'text-4xl',
    oval: 'text-3xl',
    label: 'text-[10px] tracking-widest',
  },
}

const BG: Record<CardColor, string> = {
  red: 'bg-uno-red',
  yellow: 'bg-uno-yellow',
  green: 'bg-uno-green',
  blue: 'bg-uno-blue',
}

const TEXT: Record<CardColor, string> = {
  red: 'text-uno-red',
  yellow: 'text-uno-yellow-dark',
  green: 'text-uno-green-dark',
  blue: 'text-uno-blue-dark',
}

const QUADRANT: Record<CardColor, string> = {
  red: 'bg-uno-red',
  yellow: 'bg-uno-yellow',
  green: 'bg-uno-green',
  blue: 'bg-uno-blue',
}

function SkipGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="16.5" fill="none" stroke="currentColor" strokeWidth="6" />
      <line x1="13" y1="35" x2="35" y2="13" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}

function ReverseGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        d="M14 19h16.5l-4.5-4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M34 29H17.5l4.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DrawTwoGlyph({ className }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className ?? ''}`}>
      <div className="absolute -left-2 top-1/2 h-[70%] w-[62%] -translate-y-1/2 rotate-[-14deg] rounded-[3px] border-[2.5px] border-current opacity-55" />
      <div className="absolute left-0 top-1/2 h-[76%] w-[68%] -translate-y-1/2 rotate-[-6deg] rounded-[3px] border-[2.5px] border-current bg-white/45" />
      <span className="relative translate-x-1 font-black tracking-tighter">+2</span>
    </div>
  )
}

function WildFourGlyph({ className }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className ?? ''}`}>
      <div className="absolute -top-2.5 grid grid-cols-2 gap-[2px]">
        {(['red', 'yellow', 'green', 'blue'] as CardColor[]).map((color) => (
          <span key={color} className={`h-[7px] w-[7px] rounded-[2px] ${QUADRANT[color]}`} />
        ))}
      </div>
      <span className="relative font-black tracking-tighter">+4</span>
    </div>
  )
}

interface CardViewProps {
  card: Card
  size?: CardSize
  faceDown?: boolean
  playable?: boolean
  dimmed?: boolean
  selected?: boolean
  className?: string
  style?: CSSProperties
  onClick?: () => void
  title?: string
  ariaLabel?: string
  tabIndex?: number
}

export function CardBack({ size = 'md', className = '' }: { size?: CardSize; className?: string }) {
  const s = SIZE[size]
  return (
    <div className={`card-face ${s.box} ${className}`} aria-hidden="true">
      <div className="card-inner card-back-pattern">
        <div className="card-glare" />
        <div className="card-oval bg-white/95">
          <span className={`card-back-logo font-display ${s.label}`}>UNO</span>
        </div>
      </div>
    </div>
  )
}

export function CardView({
  card,
  size = 'md',
  faceDown = false,
  playable = true,
  dimmed = false,
  selected = false,
  className = '',
  style,
  onClick,
  title,
  ariaLabel,
  tabIndex,
}: CardViewProps) {
  const s = SIZE[size]

  if (faceDown) return <CardBack size={size} className={className} />

  const isWild = card.color === 'wild'
  const color: CardColor | null = card.color === 'wild' ? null : card.color
  const interactive = !!onClick
  const cornerText = cardGlyph(card)

  const inner = isWild ? (
    <>
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        {(['red', 'yellow', 'green', 'blue'] as CardColor[]).map((quadrant) => (
          <div key={quadrant} className={QUADRANT[quadrant]} />
        ))}
      </div>
      <div className="card-glare" />
      <div className="card-oval bg-white shadow-[inset_0_0_0_2px_rgba(0,0,0,0.08)]">
        {card.kind === 'wild' ? (
          <span className={`wild-gradient-text font-display ${s.oval}`}>WILD</span>
        ) : (
          <WildFourGlyph className={`${TEXT.red} ${s.glyph}`} />
        )}
      </div>
    </>
  ) : (
    <>
      <div className={`absolute inset-0 ${BG[color!]}`} />
      <div className="card-glare" />
      <div className="card-oval bg-white">
        {card.kind === 'number' && <span className={`font-black ${TEXT[color!]} ${s.glyph}`}>{card.value}</span>}
        {card.kind === 'skip' && <SkipGlyph className={`${TEXT[color!]} ${s.glyph}`} />}
        {card.kind === 'reverse' && <ReverseGlyph className={`${TEXT[color!]} ${s.glyph}`} />}
        {card.kind === 'draw2' && <DrawTwoGlyph className={`${TEXT[color!]} ${s.glyph}`} />}
      </div>
    </>
  )

  const face = (
    <div className="card-inner">
      {inner}
      <span className={`card-corner top-0 left-0 font-display ${s.corner} text-white`}>{cornerText}</span>
      <span className={`card-corner bottom-0 right-0 rotate-180 font-display ${s.corner} text-white`}>{cornerText}</span>
    </div>
  )

  const classes = [
    'card-face select-none',
    s.box,
    interactive && playable ? 'cursor-pointer' : '',
    interactive && !playable ? 'cursor-not-allowed' : '',
    dimmed ? 'opacity-45 saturate-[.55]' : '',
    selected ? 'ring-2 ring-uno-yellow shadow-[0_0_20px_rgba(245,195,59,0.6)]' : '',
    interactive && playable ? 'hover:shadow-card-hover' : '',
    'transition-[transform,box-shadow,filter] duration-200',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        tabIndex={tabIndex ?? 0}
        title={title}
        aria-label={ariaLabel ?? title}
        disabled={!playable}
        className={classes}
        style={style}
      >
        {face}
      </button>
    )
  }

  return (
    <div title={title} aria-label={ariaLabel} className={classes} style={style}>
      {face}
    </div>
  )
}
