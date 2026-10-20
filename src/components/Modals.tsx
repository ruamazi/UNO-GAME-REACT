import { useState } from 'react'
import {
  Crown,
  Flag,
  Home,
  Lock,
  Play,
  RotateCcw,
  Share2,
  ShieldQuestion,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react'
import { COLORS, type CardColor, type GameState, type Speed } from '../game/types'
import { colorName } from '../game/cards'
import { useConsent } from '../lib/consent'
import { CardView } from './CardView'
import { Button, Modal, Segmented, Toggle } from './ui'

const COLOR_BTN: Record<CardColor, string> = {
  red: 'bg-uno-red hover:bg-red-400',
  yellow: 'bg-uno-yellow hover:bg-yellow-300 text-uno-black',
  green: 'bg-uno-green hover:bg-emerald-400',
  blue: 'bg-uno-blue hover:bg-blue-400',
}

export function ColorPickerModal({
  open,
  source,
  onChoose,
}: {
  open: boolean
  source: 'hand' | 'start' | 'challenge' | null
  onChoose: (color: CardColor) => void
}) {
  const title =
    source === 'start'
      ? 'Choose the starting color'
      : source === 'challenge'
        ? 'You won the challenge — choose the color'
        : 'Choose a color'
  return (
    <Modal open={open} title={title} maxWidth="max-w-md" dismissible={false}>
      <p className="mb-4 text-sm text-white/65">
        {source === 'challenge'
          ? 'Your challenge succeeded and the Wild +4 went back to your opponent. Set the color to continue your turn.'
          : 'Pick the color that play continues with.'}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChoose(color)}
            className={`flex h-20 flex-col items-center justify-center rounded-2xl text-lg font-black uppercase tracking-widest shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98] ${COLOR_BTN[color]}`}
          >
            {colorName(color)}
          </button>
        ))}
      </div>
    </Modal>
  )
}

export function ChallengeModal({
  state,
  stackableIds,
  onRespond,
  onStack,
}: {
  state: GameState
  stackableIds: string[]
  onRespond: (response: 'accept' | 'challenge') => void
  onStack: (cardId: string, color?: CardColor) => void
}) {
  const pending = state.pendingWild4
  const [wildStackId, setWildStackId] = useState<string | null>(null)
  if (!pending || pending.target !== 0) return null

  const offender = state.players[pending.offender]
  const count = state.pendingDraw?.count ?? 4
  const canChallenge = state.settings.strictWild4
  const stackableCards = state.players[0].hand.filter((card) => stackableIds.includes(card.id))
  const activeWild = wildStackId ? state.players[0].hand.find((card) => card.id === wildStackId) : null

  return (
    <Modal open title="Wild Draw Four!" maxWidth="max-w-md" dismissible={false}>
      <p className="text-sm leading-relaxed text-white/75">
        <strong className="text-white">{offender.name}</strong> played a Wild Draw Four and chose{' '}
        <strong className="text-white">{colorName(pending.chosenColor)}</strong>. You must draw{' '}
        <strong className="text-white">{count}</strong> cards
        {canChallenge ? ' — unless you challenge the play.' : ' because challenges are disabled in this match.'}
      </p>
      {canChallenge && (
        <p className="mt-2 flex items-start gap-2 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/60">
          <ShieldQuestion size={16} className="mt-0.5 shrink-0 text-uno-yellow" />
          Challenge succeeds only if they were holding a {colorName(pending.previousColor)} card when they played it.
          A failed challenge costs you {count + 2} cards.
        </p>
      )}

      {stackableCards.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/50">
            <Zap size={13} className="text-uno-yellow" /> Or stack your own draw card
          </p>
          <div className="flex flex-wrap gap-2">
            {stackableCards.map((card) => (
              <button
                key={card.id}
                type="button"
                className="rounded-lg transition-transform hover:-translate-y-1"
                onClick={() => (card.kind === 'wild4' ? setWildStackId(card.id) : onStack(card.id))}
              >
                <CardView card={card} size="sm" />
              </button>
            ))}
          </div>
        </div>
      )}

      {activeWild && (
        <div className="mt-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/50">Pick a color for your Wild +4</p>
          <div className="grid grid-cols-4 gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onStack(activeWild.id, color)
                  setWildStackId(null)
                }}
                className={`h-12 rounded-xl text-[10px] font-black uppercase tracking-wider shadow ${COLOR_BTN[color]}`}
              >
                {colorName(color)}
              </button>
            ))}
          </div>
        </div>
      )}

      {canChallenge ? (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="danger" onClick={() => onRespond('accept')}>
            Accept +{count}
          </Button>
          <Button variant="primary" onClick={() => onRespond('challenge')}>
            <ShieldQuestion size={16} /> Challenge
          </Button>
        </div>
      ) : (
        <Button variant="danger" className="mt-5 w-full" onClick={() => onRespond('accept')}>
          Accept +{count}
        </Button>
      )}
      <p className="mt-3 text-center text-[11px] text-white/40">
        {canChallenge
          ? 'Tip: math favors accepting unless you suspect a bluff.'
          : 'Challenges are off in this match. Take the cards and keep playing.'}
      </p>
    </Modal>
  )
}

export function RoundSummaryModal({
  state,
  onNext,
  onQuit,
}: {
  state: GameState
  onNext: () => void
  onQuit: () => void
}) {
  const result = state.roundResult
  if (!result) return null
  const winner = state.players[result.winnerIndex]

  return (
    <Modal open title="Round complete" maxWidth="max-w-lg" dismissible={false}>
      <div className="flex items-center gap-4 rounded-2xl border border-uno-yellow/30 bg-uno-yellow/10 p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-uno-yellow text-3xl shadow-inner">
          {winner.avatar}
        </div>
        <div>
          <p className="font-display text-lg text-white">{winner.name} wins the round!</p>
          <p className="text-sm text-white/70">
            +{result.points} points · total {winner.score} / {state.settings.targetScore}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        {result.breakdown.map((row) => {
          const player = state.players[row.playerIndex]
          return (
            <div
              key={row.playerIndex}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 font-semibold text-white/85">
                <span className="text-base">{player.avatar}</span> {player.name}
              </span>
              <span className="text-white/60">
                {row.cards} cards · <strong className="text-white">{row.points} pts</strong>
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-black/25 px-3 py-2 text-sm">
        <span className="text-white/60">Scoreboard</span>
        <span className="font-semibold text-white/90">
          {state.players
            .map((player) => `${player.name} ${player.score}`)
            .join('  ·  ')}
        </span>
      </div>

      <div className="mt-5 flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={onQuit}>
          <Home size={15} /> Menu
        </Button>
        <Button variant="primary" className="flex-[2]" onClick={onNext}>
          <Play size={16} /> Next round
        </Button>
      </div>
    </Modal>
  )
}

export function MatchSummaryModal({
  state,
  onRematch,
  onQuit,
  onShare,
}: {
  state: GameState
  onRematch: () => void
  onQuit: () => void
  onShare?: () => void
}) {
  const winnerIndex = state.matchWinner
  if (winnerIndex === null) return null
  const winner = state.players[winnerIndex]
  const ranked = [...state.players].sort((a, b) => b.score - a.score)

  return (
    <Modal open title="Match complete" maxWidth="max-w-lg" dismissible={false}>
      <div className="flex flex-col items-center gap-2 py-2 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-uno-yellow to-amber-500 text-4xl shadow-xl">
          <Trophy size={38} className="text-uno-black" />
        </div>
        <p className="font-display text-2xl text-white">
          {winner.avatar} {winner.name} wins!
        </p>
        <p className="text-sm text-white/65">
          {winner.score} points · first to {state.settings.targetScore}
        </p>
      </div>

      <div className="mt-4 space-y-1.5">
        {ranked.map((player, rank) => (
          <div
            key={player.id}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
              player.id === winner.id
                ? 'border-uno-yellow/40 bg-uno-yellow/10'
                : 'border-white/10 bg-black/20'
            }`}
          >
            <span className="flex items-center gap-2 font-semibold text-white/90">
              <span className="w-5 text-center text-xs text-white/40">#{rank + 1}</span>
              <span className="text-base">{player.avatar}</span> {player.name}
              {player.id === winner.id && <Crown size={14} className="text-uno-yellow" />}
            </span>
            <span className="text-white/70">
              {player.score} pts · {player.roundsWon} {player.roundsWon === 1 ? 'round' : 'rounds'}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="ghost" className="flex-1" onClick={onQuit}>
          <Home size={15} /> Menu
        </Button>
        {onShare && (
          <Button variant="dark" className="flex-1" onClick={onShare}>
            <Share2 size={15} /> Share
          </Button>
        )}
        <Button variant="primary" className="flex-[2]" onClick={onRematch}>
          <RotateCcw size={16} /> Rematch
        </Button>
      </div>
    </Modal>
  )
}

export function PauseMenuModal({
  open,
  soundOn,
  speed,
  onClose,
  onSound,
  onSpeed,
  onRestart,
  onNewMatch,
  onQuit,
}: {
  open: boolean
  soundOn: boolean
  speed: Speed
  onClose: () => void
  onSound: (value: boolean) => void
  onSpeed: (value: Speed) => void
  onRestart: () => void
  onNewMatch: () => void
  onQuit: () => void
}) {
  const { openPreferences } = useConsent()

  return (
    <Modal open={open} onClose={onClose} title="Game menu" maxWidth="max-w-sm">
      <div className="space-y-3">
        <Toggle checked={soundOn} onChange={onSound} label="Sound effects" />
        <div>
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/50">AI speed</span>
          <Segmented<Speed>
            value={speed}
            onChange={onSpeed}
            options={[
              { value: 'relaxed', label: 'Relaxed' },
              { value: 'normal', label: 'Normal' },
              { value: 'fast', label: 'Fast' },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button variant="ghost" onClick={onClose}>
            <Play size={15} /> Resume
          </Button>
          <Button variant="dark" onClick={onRestart}>
            <RotateCcw size={15} /> Restart round
          </Button>
          <Button variant="dark" onClick={onNewMatch}>
            <Flag size={15} /> New match
          </Button>
          <Button variant="danger" onClick={onQuit}>
            <Home size={15} /> Main menu
          </Button>
        </div>
        <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[11px] text-white/40">
          <Lock size={11} /> House rules are locked for the current match
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-white/10 pt-3 text-[10px] font-bold uppercase tracking-wider text-white/40">
          <a href="#/about" className="hover:text-white">
            About
          </a>
          <a href="#/privacy" className="hover:text-white">
            Privacy
          </a>
          <a href="#/terms" className="hover:text-white">
            Terms
          </a>
          <button type="button" onClick={openPreferences} className="hover:text-white">
            Cookies
          </button>
        </nav>
      </div>
    </Modal>
  )
}

export function SoundToggleButton({ soundOn, onToggle }: { soundOn: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label={soundOn ? 'Mute sound' : 'Enable sound'}
      onClick={onToggle}
      className="rounded-lg border border-white/10 bg-black/25 p-2 text-white/80 transition-colors hover:bg-black/40 hover:text-white"
    >
      {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
    </button>
  )
}
