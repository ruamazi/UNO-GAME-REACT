import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { decideBotAction, type BotAction } from '../game/ai'
import {
  beginPlay,
  catchUno,
  chooseColor,
  declareUno,
  drawCard,
  legalCards,
  passTurn,
  resolveUnoTimeout,
  respondWild4,
  sortHand,
  startRound,
  takePendingDraw,
  type SortMode,
  type Wild4Response,
} from '../game/engine'
import type { Card, CardColor, GameSettings, GameState, LogTone } from '../game/types'
import { clearSavedGame, loadSavedGame, saveGame, type SavedGame } from '../game/persistence'
import { track } from '../lib/analytics'
import { useSound } from './useSound'

export interface Toast {
  id: number
  text: string
  tone: LogTone
}

const BOT_DELAY: Record<GameSettings['speed'], [number, number]> = {
  relaxed: [1400, 700],
  normal: [850, 450],
  fast: [480, 220],
}

const INTERESTING = /(UNO|challenge|Reverse|Wild Draw Four|draws \d|wins the round|forgot|caught)/i

function applyBotAction(state: GameState, playerIndex: number, action: BotAction): GameState {
  const now = Date.now()
  switch (action.type) {
    case 'play': {
      let next = beginPlay(state, playerIndex, action.cardId, now)
      if (next.colorChoice && next.colorChoice.playerIndex === playerIndex) {
        next = chooseColor(next, playerIndex, action.color ?? 'red', now)
      }
      return next
    }
    case 'draw':
      return drawCard(state, playerIndex, now)
    case 'pass':
      return passTurn(state, playerIndex, now)
    case 'takeDraw':
      return takePendingDraw(state, playerIndex, now)
    case 'chooseColor':
      return chooseColor(state, playerIndex, action.color, now)
    case 'respondWild4':
      return respondWild4(state, playerIndex, action.response, now)
  }
}

export interface UnoGameApi {
  state: GameState | null
  toasts: Toast[]
  dismissToast: (id: number) => void
  pushToast: (text: string, tone?: LogTone) => void
  startMatch: () => void
  play: (cardId: string, color?: CardColor) => void
  draw: () => void
  pass: () => void
  takePending: () => void
  choose: (color: CardColor) => void
  respond: (response: Wild4Response) => void
  callUno: () => void
  catchUno: (playerIndex: number) => void
  sortHand: (mode: SortMode) => void
  nextRound: () => void
  newMatch: () => void
  restartRound: () => void
  quit: () => void
  savedGame: SavedGame | null
  resumeSaved: () => void
  discardSaved: () => void
  humanLegal: Card[]
  isHumanTurn: boolean
  sound: ReturnType<typeof useSound>
}

export function useUnoGame(settings: GameSettings, options: { active?: boolean } = {}): UnoGameApi {
  const active = options.active ?? true
  const [state, setState] = useState<GameState | null>(null)
  const [savedGame, setSavedGame] = useState<SavedGame | null>(() => loadSavedGame())
  const [toasts, setToasts] = useState<Toast[]>([])
  const sound = useSound(settings.soundOn)
  const toastId = useRef(0)
  const lastPlayed = useRef<string | null>(null)
  const lastLogId = useRef(0)
  const latestState = useRef<GameState | null>(null)
  const prevPhase = useRef<GameState['phase']>('playing')

  const pushToast = useCallback((text: string, tone: LogTone = 'info') => {
    toastId.current += 1
    const toast: Toast = { id: toastId.current, text, tone }
    setToasts((current) => [...current.slice(-3), toast])
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  // -------------------------------------------------------------------------
  // Persist the current match so a refresh or legal page visit never loses it
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!state) return
    latestState.current = state
    saveGame(state)
  }, [state])

  // -------------------------------------------------------------------------
  // Bot turns
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!active || !state || state.phase !== 'playing') return
    const playerIndex = state.currentPlayer
    const player = state.players[playerIndex]
    if (player.isHuman) return

    const [base, spread] = BOT_DELAY[settings.speed]
    const delay = base + Math.random() * spread
    const timer = window.setTimeout(() => {
      setState((prev) => {
        if (!prev || prev.phase !== 'playing' || prev.currentPlayer !== playerIndex) return prev
        const action = decideBotAction(prev, playerIndex)
        if (!action) return prev
        return applyBotAction(prev, playerIndex, action)
      })
    }, delay)

    return () => window.clearTimeout(timer)
  }, [active, state, settings.speed])

  // -------------------------------------------------------------------------
  // UNO window timeouts
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!active) return
    const uno = state?.uno
    if (!uno || uno.called) return
    const delay = Math.max(0, uno.expiresAt - Date.now()) + 80
    const playerIndex = uno.playerIndex
    const isHuman = !!state?.players[playerIndex]?.isHuman
    const timer = window.setTimeout(() => {
      if (isHuman) pushToast('You forgot to call UNO! +2 cards', 'bad')
      setState((prev) => {
        if (!prev?.uno || prev.uno.playerIndex !== playerIndex || prev.uno.called) return prev
        return resolveUnoTimeout(prev, Date.now())
      })
    }, delay)
    return () => window.clearTimeout(timer)
  }, [active, state?.uno, state?.players, pushToast])

  // -------------------------------------------------------------------------
  // Human quality of life: auto-pass when the drawn card is unplayable
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!active || !state || state.phase !== 'playing') return
    if (state.currentPlayer !== 0 || !state.players[0].isHuman) return
    if (state.turnPhase !== 'drawn' || !state.drawnCardId) return
    if (legalCards(state, 0).length > 0) return

    const timer = window.setTimeout(() => {
      pushToast('No playable card — passing', 'info')
      setState((prev) => (prev ? passTurn(prev, 0, Date.now()) : prev))
    }, 1400)
    return () => window.clearTimeout(timer)
  }, [active, state, pushToast])

  // -------------------------------------------------------------------------
  // Toasts + sound from the event log
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!state) return
    const fresh = state.log.filter((entry) => entry.id > lastLogId.current)
    if (fresh.length === 0) return
    lastLogId.current = state.log[state.log.length - 1]?.id ?? lastLogId.current

    for (const entry of fresh) {
      if (INTERESTING.test(entry.text)) pushToast(entry.text, entry.tone)
      if (/called UNO/i.test(entry.text)) sound.play('uno')
      if (/challenge/i.test(entry.text)) sound.play('challenge')
      if (/draws?\b|drew/i.test(entry.text) && !/discard pile/i.test(entry.text)) sound.play('draw')
    }
  }, [state, pushToast, sound])

  useEffect(() => {
    if (!state) return
    if (state.lastPlayedCardId && state.lastPlayedCardId !== lastPlayed.current) {
      lastPlayed.current = state.lastPlayedCardId
      sound.play('play')
    }
  }, [state, sound])

  useEffect(() => {
    if (!state) return
    if (state.phase !== 'playing' && prevPhase.current === 'playing') {
      sound.play('win')
      if (state.phase === 'roundOver' && state.roundResult) {
        track('round_end', {
          round: state.round,
          winner: state.roundResult.winnerIndex === 0 ? 'human' : 'bot',
          points: state.roundResult.points,
          human_score: state.players[0]?.score ?? 0,
        })
      }
      if (state.phase === 'matchOver') {
        track('match_end', {
          rounds: state.round,
          winner: state.matchWinner === 0 ? 'human' : 'bot',
          human_score: state.players[0]?.score ?? 0,
        })
      }
    }
    prevPhase.current = state.phase
  }, [state, sound])

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------
  const startMatch = useCallback(() => {
    lastLogId.current = 0
    lastPlayed.current = null
    prevPhase.current = 'playing'
    setToasts([])
    setSavedGame(null)
    clearSavedGame()
    sound.play('menu')
    track('game_start', {
      players: settings.playerCount,
      difficulty: settings.difficulty,
      target_score: settings.targetScore,
      stacking: settings.stacking,
      draw_until_playable: settings.drawUntilPlayable,
      strict_wild4: settings.strictWild4,
    })
    setState(startRound({ settings, round: 1, starter: 0 }))
  }, [settings, sound])

  const play = useCallback((cardId: string, color?: CardColor) => {
    setState((prev) => {
      if (!prev) return prev
      const now = Date.now()
      let next = beginPlay(prev, 0, cardId, now)
      if (color && next.colorChoice && next.colorChoice.playerIndex === 0) {
        next = chooseColor(next, 0, color, now)
      }
      return next
    })
  }, [])

  const draw = useCallback(() => {
    sound.play('click')
    setState((prev) => (prev ? drawCard(prev, 0, Date.now()) : prev))
  }, [sound])

  const pass = useCallback(() => {
    setState((prev) => (prev ? passTurn(prev, 0, Date.now()) : prev))
  }, [])

  const takePending = useCallback(() => {
    sound.play('click')
    setState((prev) => (prev ? takePendingDraw(prev, 0, Date.now()) : prev))
  }, [sound])

  const choose = useCallback((color: CardColor) => {
    sound.play('click')
    setState((prev) => (prev ? chooseColor(prev, 0, color, Date.now()) : prev))
  }, [sound])

  const respond = useCallback(
    (response: Wild4Response) => {
      setState((prev) => (prev ? respondWild4(prev, 0, response, Date.now()) : prev))
    },
    [],
  )

  const callUno = useCallback(() => {
    sound.play('click')
    track('uno_call')
    setState((prev) => (prev ? declareUno(prev, 0, Date.now()) : prev))
  }, [sound])

  const catchPlayerUno = useCallback(
    (playerIndex: number) => {
      sound.play('click')
      track('uno_catch', { opponent: playerIndex })
      setState((prev) => (prev ? catchUno(prev, playerIndex, Date.now()) : prev))
    },
    [sound],
  )

  const sortHumanHand = useCallback(
    (mode: SortMode) => {
      sound.play('click')
      setState((prev) => (prev ? sortHand(prev, 0, mode) : prev))
    },
    [sound],
  )

  const nextRound = useCallback(() => {
    if (!state || state.phase !== 'roundOver') return
    track('round_start', { round: state.round + 1, resumed: false })
    setState(
      startRound({
        settings: state.settings,
        players: state.players,
        round: state.round + 1,
        starter: state.roundResult?.winnerIndex ?? 0,
      }),
    )
  }, [state])

  const newMatch = useCallback(() => {
    const activeSettings = state?.settings ?? settings
    track('game_start', {
      players: activeSettings.playerCount,
      difficulty: activeSettings.difficulty,
      source: 'rematch',
    })
    setState(startRound({ settings: activeSettings, round: 1, starter: 0 }))
  }, [settings, state])

  const restartRound = useCallback(() => {
    if (!state) return
    track('round_restart', { round: state.round })
    setState(
      startRound({
        settings: state.settings,
        players: state.players,
        round: state.round,
        starter: 0,
      }),
    )
  }, [state])

  const quit = useCallback(() => {
    const latest = latestState.current
    if (latest) {
      saveGame(latest)
      setSavedGame({ state: latest, savedAt: Date.now() })
      track('game_quit', { round: latest.round, human_score: latest.players[0]?.score ?? 0 })
    }
    setState(null)
    setToasts([])
    lastLogId.current = 0
    lastPlayed.current = null
    prevPhase.current = 'playing'
  }, [])

  const resumeSaved = useCallback(() => {
    const saved = savedGame ?? loadSavedGame()
    if (!saved) {
      pushToast('No saved game was found on this device.', 'info')
      setSavedGame(null)
      return
    }
    lastLogId.current = saved.state.logSeq
    lastPlayed.current = saved.state.lastPlayedCardId
    prevPhase.current = saved.state.phase
    setToasts([])
    setState(saved.state)
    pushToast(`Welcome back — round ${saved.state.round} resumed.`, 'good')
    track('game_resume', { round: saved.state.round, human_score: saved.state.players[0]?.score ?? 0 })
  }, [savedGame, pushToast])

  const discardSaved = useCallback(() => {
    clearSavedGame()
    setSavedGame(null)
    pushToast('Saved game cleared.', 'info')
  }, [pushToast])

  const humanLegal = useMemo(() => (state ? legalCards(state, 0) : []), [state])
  const isHumanTurn = !!state && state.currentPlayer === 0 && state.phase === 'playing'

  return {
    state,
    toasts,
    dismissToast,
    pushToast,
    startMatch,
    play,
    draw,
    pass,
    takePending,
    choose,
    respond,
    callUno,
    catchUno: catchPlayerUno,
    sortHand: sortHumanHand,
    nextRound,
    newMatch,
    restartRound,
    quit,
    savedGame,
    resumeSaved,
    discardSaved,
    humanLegal,
    isHumanTurn,
    sound,
  }
}
