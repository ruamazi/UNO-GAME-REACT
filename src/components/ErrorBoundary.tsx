import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { track } from '../lib/analytics'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Keeps a runtime error from turning the whole site into a blank screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('UNO Classic crashed', error, info.componentStack)
    track('app_error', { message: error.message.slice(0, 120) })
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="table-felt vignette flex min-h-full items-center justify-center p-6">
        <div className="glass w-full max-w-md rounded-2xl p-6 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-uno-red/20 text-3xl">🃏</div>
          <h1 className="mt-4 font-display text-xl text-white">That hand went sideways</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/65">
            The game hit an unexpected error. Your saved match is still stored in this browser, so reloading should
            bring you right back.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-uno-yellow px-4 py-3 text-sm font-black uppercase tracking-wide text-uno-black"
            >
              <RefreshCw size={16} /> Reload game
            </button>
            <a
              href="#/"
              onClick={() => this.setState({ error: null })}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white/75 hover:bg-white/15"
            >
              Back to main menu
            </a>
          </div>
          <p className="mt-4 text-[10px] leading-relaxed text-white/30">
            If this keeps happening, please report it through the contact page.
          </p>
        </div>
      </div>
    )
  }
}
