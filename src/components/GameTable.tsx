import { useEffect, useState } from 'react'
import {
  ArrowDownWideNarrow,
  Check,
  Flag,
  History,
  Layers,
  ListOrdered,
  Maximize2,
  Menu as MenuIcon,
  Minimize2,
  Palette,
  ShieldAlert,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { siteConfig } from '../config'
import type { CardColor, GameSettings, GameState } from '../game/types'
import { colorName } from '../game/cards'
import type { UnoGameApi } from '../hooks/useUnoGame'
import { shareAppUrl, shareText } from '../lib/share'
import { AdSlot } from './AdSlot'
import { CardView } from './CardView'
import { CenterPile } from './CenterPile'
import { Hand } from './Hand'
import {
  ChallengeModal,
  ColorPickerModal,
  MatchSummaryModal,
  PauseMenuModal,
  RoundSummaryModal,
} from './Modals'
import { OpponentSeat } from './OpponentSeat'
import { SidePanel } from './SidePanel'
import { Confetti, IconButton } from './ui'

function ThinkingDots() {
  return (
    <span className="inline-flex gap-0.5">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="inline-block h-1 w-1 animate-bounce rounded-full bg-current"
          style={{ animationDelay: `${index * 0.15}s` }}
        />
      ))}
    </span>
  )
}

const COLOR_DOT: Record<CardColor, string> = {
  red: 'bg-uno-red',
  yellow: 'bg-uno-yellow',
  green: 'bg-uno-green',
  blue: 'bg-uno-blue',
}

function turnInfo(state: GameState, humanLegalCount: number): { text: string; tone: string } {
  const current = state.players[state.currentPlayer]
  if (state.colorChoice && !current.isHuman) {
    return { text: `${current.name} is choosing a color`, tone: 'text-white/60' }
  }
  if (state.turnPhase === 'wild4Response' && !current.isHuman) {
    return { text: `${current.name} is deciding on the Wild +4`, tone: 'text-white/60' }
  }
  if (current.isHuman) {
    const pending = state.pendingDraw?.count ?? 0
    if (pending > 0) {
      return humanLegalCount > 0
        ? { text: `Stack a draw card or take +${pending}`, tone: 'text-uno-yellow' }
        : { text: `You must take +${pending} cards`, tone: 'text-uno-red' }
    }
    if (state.turnPhase === 'drawn') {
      return humanLegalCount > 0
        ? { text: 'You drew a playable card — play it or keep it', tone: 'text-white' }
        : { text: 'No play — passing…', tone: 'text-white/60' }
    }
    if (state.unoArmed && state.players[0].hand.length === 2) {
      return { text: 'UNO armed — play your card!', tone: 'text-uno-yellow' }
    }
    return { text: 'Your turn — play a card or draw', tone: 'text-uno-yellow' }
  }
  return { text: `${current.name} is thinking`, tone: 'text-white/60' }
}

export function GameTable({
  api,
  settings,
  onChangeSettings,
}: {
  api: UnoGameApi
  settings: GameSettings
  onChangeSettings: (patch: Partial<GameSettings>) => void
}) {
  const { state } = api
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelTab, setPanelTab] = useState<'log' | 'scores'>('log')
  const [pauseOpen, setPauseOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      // Fullscreen can be blocked by the browser or an embedded frame.
    }
  }

  const handleShareMatch = async () => {
    if (!state || state.matchWinner === null) return
    const humanWon = state.matchWinner === 0
    const human = state.players[0]
    const text = humanWon
      ? `I won my UNO match with ${human.score} points against ${state.players.length - 1} AI opponents! Can you beat that?`
      : `I just played UNO Classic — ${state.players[state.matchWinner].name} won with ${state.players[state.matchWinner].score} points. Your turn!`
    const result = await shareText(text, shareAppUrl())
    if (result === 'shared') api.pushToast('Thanks for sharing!', 'good')
    else if (result === 'copied') api.pushToast('Result copied — challenge a friend!', 'good')
    else if (result === 'failed') api.pushToast('Could not share. Copy the address bar URL instead.', 'bad')
  }

  if (!state) return null

  const human = state.players[0]
  const legalIds = new Set(api.humanLegal.map((card) => card.id))
  const isMyTurn = state.currentPlayer === 0 && state.phase === 'playing'
  const canInteract =
    isMyTurn && !state.colorChoice && (state.turnPhase === 'idle' || state.turnPhase === 'drawn')
  const canDraw = isMyTurn && state.turnPhase === 'idle' && !state.pendingDraw
  const info = turnInfo(state, api.humanLegal.length)
  const drawnCard = state.drawnCardId ? human.hand.find((card) => card.id === state.drawnCardId) : null
  const unoSaveable = state.uno?.playerIndex === 0 && !state.uno.called && Date.now() < state.uno.expiresAt
  const showUnoButton =
    (isMyTurn && human.hand.length === 2 && (state.turnPhase === 'idle' || state.turnPhase === 'drawn')) || unoSaveable
  const pendingCount = state.pendingDraw?.count ?? 0

  return (
    <div className="table-felt vignette relative flex h-full min-h-0 flex-col overflow-hidden">
      {/* table inlays */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden items-center justify-center sm:flex">
        <div className="h-[min(70vh,38rem)] w-[min(92vw,64rem)] rounded-[50%] border border-white/10 shadow-[inset_0_0_90px_rgba(0,0,0,0.35)]" />
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-display text-[24vw] leading-none text-white/[0.025]"
      >
        UNO
      </span>

      {/* ---------------------------------------------------------------- header */}
      <header className="relative z-20 flex items-center justify-between gap-2 px-3 py-2.5 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="font-display text-xl tracking-wide text-white drop-shadow sm:text-2xl">UNO</span>
          <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white/70">
            Round {state.round}
          </span>
          <span className="hidden rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white/70 md:inline-flex">
            <Flag size={11} className="mr-1.5" /> Target {state.settings.targetScore}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <IconButton
            label="Activity log"
            onClick={() => {
              setPanelTab('log')
              setPanelOpen(true)
            }}
          >
            <History size={16} />
          </IconButton>
          <IconButton
            label="Scores"
            onClick={() => {
              setPanelTab('scores')
              setPanelOpen(true)
            }}
          >
            <ListOrdered size={16} />
          </IconButton>
          <IconButton
            label={settings.soundOn ? 'Mute sound' : 'Enable sound'}
            onClick={() => onChangeSettings({ soundOn: !settings.soundOn })}
          >
            {settings.soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </IconButton>
          <IconButton
            label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            onClick={toggleFullscreen}
          >
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </IconButton>
          <IconButton label="Game menu" onClick={() => setPauseOpen(true)}>
            <MenuIcon size={16} />
          </IconButton>
        </div>
      </header>

      {/* ----------------------------------------------------------- opponents */}
      <section className="relative z-10 flex flex-wrap items-start justify-center gap-2 px-2 sm:gap-4 sm:px-4">
        {state.players.slice(1).map((player, offset) => {
          const index = offset + 1
          return (
            <OpponentSeat
              key={player.id}
              player={player}
              isCurrent={state.currentPlayer === index && state.phase === 'playing'}
              isNext={state.direction === 1 ? state.currentPlayer === index - 1 : state.currentPlayer === index + 1}
              unoUncalled={state.uno?.playerIndex === index && !state.uno.called}
              onCatch={() => api.catchUno(index)}
              thinking={state.currentPlayer === index && state.phase === 'playing'}
            />
          )
        })}
      </section>

      {/* --------------------------------------------------------------- center */}
      <section className="relative z-10 flex flex-1 items-center justify-center px-3">
        <CenterPile state={state} canDraw={canDraw} onDraw={api.draw} />
      </section>

      {/* desktop-only banner keeps mobile play controls uncluttered */}
      <div className="relative z-10 hidden w-full justify-center px-4 lg:flex">
        <AdSlot slot={siteConfig.adSlots.game} minHeight={90} className="w-full max-w-2xl" />
      </div>

      {/* --------------------------------------------------------------- footer */}
      <footer className="relative z-20 flex flex-col items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
        {/* turn banner */}
        <div className="flex min-h-8 flex-wrap items-center justify-center gap-2 text-center">
          <span className={`text-sm font-bold ${info.tone}`}>
            {info.text}
            {state.currentPlayer !== 0 && state.phase === 'playing' && <ThinkingDots />}
          </span>
          {pendingCount > 0 && isMyTurn && (
            <span className="rounded-full bg-uno-red/25 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-red-100 ring-1 ring-uno-red/40">
              pending +{pendingCount}
            </span>
          )}
        </div>

        {/* context action bar */}
        {isMyTurn && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {state.turnPhase === 'idle' && !state.pendingDraw && (
              <button
                type="button"
                onClick={api.draw}
                className={`inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/85 transition-colors hover:bg-black/60 ${
                  api.humanLegal.length === 0 ? 'animate-pulse-ring' : ''
                }`}
              >
                <Layers size={14} /> Draw card
              </button>
            )}

            {state.turnPhase === 'drawn' && drawnCard && (
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/35 py-1.5 pl-1.5 pr-3">
                <CardView card={drawnCard} size="xs" />
                <span className="text-xs font-semibold text-white/70">
                  {legalIds.has(drawnCard.id) ? 'Playable card' : 'Not playable'}
                </span>
                {legalIds.has(drawnCard.id) && (
                  <>
                    <button
                      type="button"
                      onClick={() => api.play(drawnCard.id)}
                      className="rounded-lg bg-uno-green px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white transition-colors hover:bg-emerald-500"
                    >
                      Play
                    </button>
                    <button
                      type="button"
                      onClick={api.pass}
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white/80 transition-colors hover:bg-white/20"
                    >
                      Keep
                    </button>
                  </>
                )}
              </div>
            )}

            {pendingCount > 0 && (
              <button
                type="button"
                onClick={api.takePending}
                className="inline-flex items-center gap-2 rounded-xl bg-uno-red px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-[0_3px_0_#8f1f1b] transition-all hover:bg-red-500 active:translate-y-[2px] active:shadow-none"
              >
                <ShieldAlert size={14} /> Take +{pendingCount}
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => api.sortHand('color')}
                title="Sort hand by color"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white/65 transition-colors hover:bg-black/50 hover:text-white"
              >
                <Palette size={13} /> Sort
              </button>
              <button
                type="button"
                onClick={() => api.sortHand('value')}
                title="Sort hand by value"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white/65 transition-colors hover:bg-black/50 hover:text-white"
              >
                <ArrowDownWideNarrow size={13} /> Sort
              </button>
            </div>

            {showUnoButton && (
              <button
                type="button"
                onClick={api.callUno}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 font-display text-sm uppercase tracking-widest text-white shadow-lg transition-transform hover:scale-105 ${
                  state.unoArmed || state.uno?.called
                    ? 'bg-uno-green shadow-[0_0_18px_rgba(58,166,92,0.6)]'
                    : 'animate-pulse-ring bg-uno-red'
                }`}
              >
                {state.unoArmed || state.uno?.called ? <Check size={15} /> : <Sparkles size={14} />} UNO!
              </button>
            )}
          </div>
        )}

        {/* hand */}
        <Hand
          cards={human.hand}
          interactive={canInteract}
          playableIds={legalIds}
          highlightId={state.drawnCardId}
          onPlay={api.play}
        />

        {/* color indicator for wilds on the pile */}
        <div className="flex items-center gap-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
          <span className={`h-2.5 w-2.5 rounded-full ${COLOR_DOT[state.currentColor]}`} />
          color in play: {colorName(state.currentColor)}
        </div>
      </footer>

      {/* --------------------------------------------------------------- modals */}
      <ColorPickerModal
        open={state.colorChoice?.playerIndex === 0}
        source={state.colorChoice?.source ?? null}
        onChoose={(color: CardColor) => api.choose(color)}
      />
      {state.turnPhase === 'wild4Response' && state.pendingWild4?.target === 0 && (
        <ChallengeModal
          state={state}
          stackableIds={api.humanLegal.map((card) => card.id)}
          onRespond={api.respond}
          onStack={(cardId, color) => api.play(cardId, color)}
        />
      )}
      {state.phase === 'roundOver' && (
        <RoundSummaryModal state={state} onNext={api.nextRound} onQuit={api.quit} />
      )}
      {state.phase === 'matchOver' && (
        <>
          <Confetti />
          <MatchSummaryModal state={state} onRematch={api.newMatch} onQuit={api.quit} onShare={handleShareMatch} />
        </>
      )}

      <PauseMenuModal
        open={pauseOpen}
        soundOn={settings.soundOn}
        speed={settings.speed}
        onClose={() => setPauseOpen(false)}
        onSound={(value) => onChangeSettings({ soundOn: value })}
        onSpeed={(value) => onChangeSettings({ speed: value })}
        onRestart={() => {
          api.restartRound()
          setPauseOpen(false)
        }}
        onNewMatch={() => {
          api.newMatch()
          setPauseOpen(false)
        }}
        onQuit={() => {
          setPauseOpen(false)
          api.quit()
        }}
      />

      <SidePanel
        open={panelOpen}
        tab={panelTab}
        state={state}
        onTab={setPanelTab}
        onClose={() => setPanelOpen(false)}
      />
    </div>
  )
}
