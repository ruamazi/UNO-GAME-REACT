import { useState } from 'react'
import { BookOpen, Play, RotateCcw, Share2, Sparkles, Trash2, Volume2, VolumeX } from 'lucide-react'
import { siteConfig } from '../config'
import type { SavedGame } from '../game/persistence'
import type { Card, Difficulty, GameSettings } from '../game/types'
import { shareAnnouncement, shareAppUrl, shareText } from '../lib/share'
import { AdSlot } from './AdSlot'
import { CardBack, CardView } from './CardView'
import { SiteFooter } from './SiteFooter'
import { Button, IconButton, Modal, Segmented, Toggle } from './ui'

const AVATARS = ['🧑‍🚀', '🐱', '🐶', '🦄', '🐲', '🤠', '👽', '🐧']

const SAMPLE_CARDS: Card[] = [
  { id: 'demo-red-7', color: 'red', kind: 'number', value: 7 },
  { id: 'demo-blue-skip', color: 'blue', kind: 'skip' },
  { id: 'demo-green-draw2', color: 'green', kind: 'draw2' },
  { id: 'demo-wild', color: 'wild', kind: 'wild' },
]

function UnoTitle() {
  const letters: { letter: string; color: string }[] = [
    { letter: 'U', color: 'text-uno-red' },
    { letter: 'N', color: 'text-uno-yellow' },
    { letter: 'O', color: 'text-uno-blue' },
  ]
  return (
    <h1 className="flex items-center gap-1 font-display text-[clamp(4rem,14vw,8rem)] leading-none">
      {letters.map(({ letter, color }) => (
        <span key={letter} className={`${color} drop-shadow-[0_6px_0_rgba(0,0,0,0.45)]`}>
          {letter}
        </span>
      ))}
    </h1>
  )
}

function savedAgo(timestamp: number): string {
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  return `${Math.floor(hours / 24)} days ago`
}

function HowToPlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="How to play" maxWidth="max-w-2xl">
      <div className="thin-scroll max-h-[65vh] space-y-4 overflow-y-auto pr-1 text-sm leading-relaxed text-white/80">
        <p>
          Be the first to get rid of all your cards. Match the top discard by <strong className="text-white">color</strong>{' '}
          or <strong className="text-white">number/symbol</strong>, or play a Wild.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="font-bold text-white">Action cards</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-white/70">
              <li>
                <strong className="text-white">Skip</strong> — next player loses their turn.
              </li>
              <li>
                <strong className="text-white">Reverse</strong> — play direction flips (acts as Skip with 2 players).
              </li>
              <li>
                <strong className="text-white">+2</strong> — next player draws 2 and is skipped.
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="font-bold text-white">Wild cards</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-white/70">
              <li>
                <strong className="text-white">Wild</strong> — choose the next color.
              </li>
              <li>
                <strong className="text-white">Wild +4</strong> — choose a color; next player draws 4 and may challenge.
              </li>
            </ul>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="font-bold text-white">Call UNO!</p>
          <p className="mt-1 text-white/70">
            When you play your second-to-last card, hit the <strong className="text-white">UNO</strong> button. If you
            forget, opponents can catch you — and you draw 2 penalty cards. Catch AI opponents with the same trick!
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="font-bold text-white">Scoring</p>
          <p className="mt-1 text-white/70">
            The round winner scores the value of every card left in the other players' hands: numbers are face value,
            action cards 20, wilds 50. First player to reach the target score wins the match.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="font-bold text-white">House rules</p>
          <p className="mt-1 text-white/70">
            <strong className="text-white">Stacking</strong> lets you answer a +2/+4 with your own +2/+4, passing the
            growing penalty on. <strong className="text-white">Draw until playable</strong> keeps drawing until you find
            a legal card. <strong className="text-white">Strict Wild +4</strong> only lets you play it when you have no
            card of the current color — and enables challenges.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="font-bold text-white">Saved automatically</p>
          <p className="mt-1 text-white/70">
            Your match is saved in this browser after every move. Close the tab and pick up where you left off from the
            main menu. No account needed.
          </p>
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <Button variant="primary" onClick={onClose}>
          Got it
        </Button>
      </div>
    </Modal>
  )
}

function ResumeCard({
  savedGame,
  onResume,
  onDiscard,
}: {
  savedGame: SavedGame
  onResume: () => void
  onDiscard: () => void
}) {
  const { state } = savedGame
  const human = state.players[0]
  const opponents = state.players.slice(1).map((player) => player.avatar).join(' ')

  return (
    <section className="glass mb-5 flex flex-col gap-3 rounded-2xl border-uno-yellow/30 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-uno-yellow/20 text-uno-yellow ring-1 ring-uno-yellow/40">
          <RotateCcw size={20} />
        </div>
        <div className="min-w-0">
          <p className="font-display text-sm tracking-wide text-white">Continue your match</p>
          <p className="truncate text-xs text-white/60">
            Round {state.round} · {human.avatar} You {human.score} pts vs {opponents} · saved {savedAgo(savedGame.savedAt)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onDiscard}
          title="Discard saved game"
          aria-label="Discard saved game"
          className="rounded-lg border border-white/10 bg-black/25 p-2.5 text-white/50 transition-colors hover:bg-black/40 hover:text-white"
        >
          <Trash2 size={15} />
        </button>
        <Button variant="primary" onClick={onResume}>
          <Play size={16} /> Resume
        </Button>
      </div>
    </section>
  )
}

export function StartScreen({
  settings,
  savedGame,
  onChange,
  onStart,
  onResume,
  onDiscardSaved,
}: {
  settings: GameSettings
  savedGame: SavedGame | null
  onChange: (patch: Partial<GameSettings>) => void
  onStart: () => void
  onResume: () => void
  onDiscardSaved: () => void
}) {
  const [howToOpen, setHowToOpen] = useState(false)
  const [shared, setShared] = useState(false)

  const handleShare = async () => {
    const result = await shareText(shareAnnouncement(), shareAppUrl())
    if (result !== 'shared' && result !== 'copied') return
    setShared(true)
    window.setTimeout(() => setShared(false), 2500)
  }

  return (
    <div className="table-felt vignette relative min-h-full overflow-x-hidden">
      {/* Decorative floating cards */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="animate-float-soft absolute -left-6 top-[18%] hidden -rotate-12 opacity-80 sm:left-[6%] sm:block">
          <CardView card={SAMPLE_CARDS[0]} size="lg" />
        </div>
        <div
          className="animate-float-soft absolute -right-4 top-[10%] hidden rotate-[14deg] opacity-80 sm:right-[8%] sm:block"
          style={{ animationDelay: '0.8s' }}
        >
          <CardBack size="lg" />
        </div>
        <div
          className="animate-float-soft absolute bottom-[8%] left-[8%] hidden rotate-[8deg] opacity-60 lg:block"
          style={{ animationDelay: '1.4s' }}
        >
          <CardView card={SAMPLE_CARDS[3]} size="lg" />
        </div>
        <div
          className="animate-float-soft absolute bottom-[14%] right-[9%] hidden -rotate-6 opacity-60 lg:block"
          style={{ animationDelay: '0.4s' }}
        >
          <CardView card={SAMPLE_CARDS[2]} size="lg" />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 py-4 sm:py-6">
        <AdSlot slot={siteConfig.adSlots.startTop} minHeight={90} className="mb-3 w-full" />

        {savedGame && <ResumeCard savedGame={savedGame} onResume={onResume} onDiscard={onDiscardSaved} />}

        <div className="flex flex-1 flex-col items-center justify-center gap-8 py-4 lg:flex-row lg:items-stretch lg:gap-12 lg:py-8">
          <div className="flex flex-col items-center justify-center text-center lg:flex-1">
            <UnoTitle />
            <p className="mt-2 max-w-sm text-balance text-sm font-medium text-white/70 sm:text-base">
              The classic card game — play against up to five AI opponents with house rules, challenges and match
              scoring.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {SAMPLE_CARDS.slice(0, 3).map((card) => (
                <CardView key={card.id} card={card} size="sm" className="animate-pop-in" />
              ))}
              <CardBack size="sm" className="animate-pop-in" />
            </div>
            <Button variant="primary" className="mt-6 px-8 py-3.5 text-base" onClick={onStart}>
              <Play size={18} /> Start game
            </Button>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setHowToOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/80 transition-colors hover:bg-black/40 hover:text-white"
              >
                <BookOpen size={14} /> How to play
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/80 transition-colors hover:bg-black/40 hover:text-white"
              >
                <Share2 size={14} /> {shared ? 'Link copied!' : 'Challenge a friend'}
              </button>
            </div>
            <p className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-wider text-white/35">
              <span>Free</span>
              <span aria-hidden="true">·</span>
              <span>No sign-up</span>
              <span aria-hidden="true">·</span>
              <span>Auto-save</span>
            </p>
          </div>

          <div className="glass w-full max-w-md rounded-2xl p-5 shadow-2xl sm:p-6 lg:flex-1 lg:self-center">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg tracking-wide text-white">Game setup</h2>
              <IconButton
                label={settings.soundOn ? 'Mute sound' : 'Enable sound'}
                onClick={() => onChange({ soundOn: !settings.soundOn })}
              >
                {settings.soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </IconButton>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/50" htmlFor="name">
                  Your name
                </label>
                <input
                  id="name"
                  value={settings.playerName}
                  maxLength={14}
                  onChange={(event) => onChange({ playerName: event.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm font-semibold text-white outline-none transition-colors placeholder:text-white/30 focus:border-uno-yellow/70"
                  placeholder="You"
                />
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/50">Avatar</span>
                <div className="flex flex-wrap gap-1.5">
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => onChange({ playerAvatar: avatar })}
                      aria-label={`Choose avatar ${avatar}`}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border text-base transition-all sm:h-9 sm:w-9 sm:text-lg ${
                        settings.playerAvatar === avatar
                          ? 'border-uno-yellow/70 bg-uno-yellow/20 scale-105'
                          : 'border-white/10 bg-black/25 hover:bg-black/40'
                      }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/50">
                  Players · {settings.playerCount}
                </span>
                <Segmented
                  value={String(settings.playerCount)}
                  onChange={(value) => onChange({ playerCount: Number(value) })}
                  options={[2, 3, 4, 5, 6].map((count) => ({ value: String(count), label: String(count) }))}
                />
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/50">Target score</span>
                <Segmented
                  value={String(settings.targetScore)}
                  onChange={(value) => onChange({ targetScore: Number(value) })}
                  options={[
                    { value: '200', label: '200' },
                    { value: '500', label: '500' },
                    { value: '1000', label: '1000' },
                  ]}
                />
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/50">
                  AI difficulty
                </span>
                <Segmented<Difficulty>
                  value={settings.difficulty}
                  onChange={(value) => onChange({ difficulty: value })}
                  options={[
                    { value: 'chill', label: 'Chill' },
                    { value: 'sharp', label: 'Sharp' },
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Toggle
                  checked={settings.stacking}
                  onChange={(value) => onChange({ stacking: value })}
                  label="Stacking (+2 / +4)"
                  description="Answer a pending draw with your own draw card."
                />
                <Toggle
                  checked={settings.drawUntilPlayable}
                  onChange={(value) => onChange({ drawUntilPlayable: value })}
                  label="Draw until playable"
                  description="Keep drawing until you find a card you can play."
                />
                <Toggle
                  checked={settings.strictWild4}
                  onChange={(value) => onChange({ strictWild4: value })}
                  label="Strict Wild +4 & challenges"
                  description="Only play it with no color match — targets may challenge."
                />
              </div>

              <Button variant="primary" className="w-full py-3.5 text-base" onClick={onStart}>
                <Play size={18} /> Start game
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-center text-[11px] font-medium text-white/45">
                <Sparkles size={12} /> Single-player vs AI · no account needed
              </p>
            </div>
          </div>
        </div>

        <AdSlot slot={siteConfig.adSlots.startBottom} minHeight={100} className="mt-3 w-full" />
        <SiteFooter />
      </div>

      <HowToPlay open={howToOpen} onClose={() => setHowToOpen(false)} />
    </div>
  )
}
