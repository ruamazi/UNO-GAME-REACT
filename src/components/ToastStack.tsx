import { useEffect } from 'react'
import { AlertTriangle, Bell, PartyPopper, Sparkles } from 'lucide-react'
import type { LogTone } from '../game/types'
import type { Toast } from '../hooks/useUnoGame'

function ToastItem({ toast, onDone }: { toast: Toast; onDone: (id: number) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDone(toast.id), 4200)
    return () => window.clearTimeout(timer)
  }, [toast.id, onDone])

  const styles: Record<LogTone, string> = {
    info: 'border-white/15 bg-black/70 text-white',
    good: 'border-uno-green/50 bg-emerald-950/85 text-emerald-50',
    bad: 'border-uno-red/50 bg-red-950/85 text-red-50',
    human: 'border-uno-blue/50 bg-blue-950/85 text-blue-50',
    bot: 'border-white/15 bg-black/70 text-white',
  }

  const icons: Record<LogTone, React.ReactNode> = {
    info: <Bell size={15} className="text-white/70" />,
    good: <PartyPopper size={15} className="text-uno-green" />,
    bad: <AlertTriangle size={15} className="text-uno-red" />,
    human: <Sparkles size={15} className="text-uno-blue" />,
    bot: <Bell size={15} className="text-white/70" />,
  }

  return (
    <button
      type="button"
      onClick={() => onDone(toast.id)}
      className={`animate-toast-in pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium shadow-xl backdrop-blur ${styles[toast.tone]}`}
    >
      <span className="mt-0.5 shrink-0">{icons[toast.tone]}</span>
      <span className="leading-snug">{toast.text}</span>
    </button>
  )
}

export function ToastStack({ toasts, onDone }: { toasts: Toast[]; onDone: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDone={onDone} />
      ))}
    </div>
  )
}
