import { useEffect, useMemo, type ReactNode } from 'react'
import { X } from 'lucide-react'

type ButtonVariant = 'primary' | 'danger' | 'ghost' | 'dark' | 'success'

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-uno-yellow text-uno-black hover:bg-yellow-300 active:bg-yellow-400 shadow-[0_4px_0_#b8860b] hover:shadow-[0_3px_0_#b8860b] active:translate-y-[3px] active:shadow-none',
  danger:
    'bg-uno-red text-white hover:bg-red-500 active:bg-red-700 shadow-[0_4px_0_#8f1f1b] hover:shadow-[0_3px_0_#8f1f1b] active:translate-y-[3px] active:shadow-none',
  success:
    'bg-uno-green text-white hover:bg-emerald-500 active:bg-emerald-700 shadow-[0_4px_0_#155e33] hover:shadow-[0_3px_0_#155e33] active:translate-y-[3px] active:shadow-none',
  ghost: 'bg-white/10 text-white hover:bg-white/20 active:bg-white/25 border border-white/10',
  dark: 'bg-black/40 text-white hover:bg-black/55 active:bg-black/60 border border-white/10',
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function IconButton({
  children,
  label,
  className = '',
  active = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
        active
          ? 'border-uno-yellow/60 bg-uno-yellow/20 text-uno-yellow'
          : 'border-white/10 bg-black/25 text-white/80 hover:bg-black/40 hover:text-white'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  description?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:bg-white/10"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-white">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-snug text-white/55">{description}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-uno-green' : 'bg-white/20'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className = '',
}: {
  value: T
  options: { value: T; label: string; icon?: ReactNode }[]
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div className={`flex rounded-xl border border-white/10 bg-black/25 p-1 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
            value === option.value ? 'bg-white/15 text-white shadow-sm' : 'text-white/55 hover:text-white'
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  children,
  title,
  maxWidth = 'max-w-lg',
  dismissible = true,
}: {
  open: boolean
  onClose?: () => void
  children: ReactNode
  title?: string
  maxWidth?: string
  dismissible?: boolean
}) {
  useEffect(() => {
    if (!open || !dismissible || !onClose) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, dismissible, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 cursor-default bg-black/65 backdrop-blur-sm"
        onClick={dismissible ? onClose : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`glass animate-rise-in relative w-full ${maxWidth} overflow-hidden rounded-2xl p-5 shadow-2xl sm:p-6`}
      >
        {(title || (dismissible && onClose)) && (
          <div className="mb-4 flex items-center justify-between gap-4">
            {title && <h2 className="font-display text-xl tracking-wide text-white">{title}</h2>}
            {dismissible && onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function Chip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/80 ${className}`}
    >
      {children}
    </span>
  )
}

const CONFETTI_COLORS = ['#e6483d', '#f5c33b', '#3aa65c', '#2f7fd1', '#ffffff', '#ff8fd0']

export function Confetti({ pieces = 90 }: { pieces?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: pieces }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        delay: Math.random() * 2.4,
        duration: 3 + Math.random() * 2.6,
        drift: (Math.random() - 0.5) * 260,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 6 + Math.random() * 8,
        rotate: Math.random() * 360,
      })),
    [pieces],
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden="true">
      {items.map((item) => (
        <span
          key={item.id}
          className="confetti-piece"
          style={{
            left: `${item.left}%`,
            width: item.size,
            height: item.size * (Math.random() > 0.5 ? 0.45 : 1),
            background: item.color,
            animationDelay: `${item.delay}s`,
            animationDuration: `${item.duration}s`,
            transform: `rotate(${item.rotate}deg)`,
            ['--drift' as string]: `${item.drift}px`,
          }}
        />
      ))}
    </div>
  )
}
