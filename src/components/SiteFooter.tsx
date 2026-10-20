import { Cookie, Heart, Mail } from 'lucide-react'
import { siteConfig } from '../config'
import { useConsent } from '../lib/consent'

const LINKS = [
  { href: '#/about', label: 'About' },
  { href: '#/privacy', label: 'Privacy' },
  { href: '#/terms', label: 'Terms' },
  { href: '#/contact', label: 'Contact' },
]

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  const { openPreferences } = useConsent()
  const year = new Date().getFullYear()

  return (
    <footer
      className={`relative z-10 mx-auto w-full max-w-6xl text-center text-white/45 ${
        compact ? 'px-3 py-3' : 'px-4 pb-6 pt-8'
      }`}
    >
      <nav
        aria-label="Site information"
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-bold uppercase tracking-wider"
      >
        {LINKS.map((link) => (
          <a key={link.href} href={link.href} className="transition-colors hover:text-white">
            {link.label}
          </a>
        ))}
        <button
          type="button"
          onClick={openPreferences}
          className="inline-flex items-center gap-1 transition-colors hover:text-white"
        >
          <Cookie size={11} /> Cookie settings
        </button>
        {!compact && siteConfig.contactEmail && !siteConfig.contactEmail.includes('your-domain') && (
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="inline-flex items-center gap-1 transition-colors hover:text-white"
          >
            <Mail size={11} /> {siteConfig.contactEmail}
          </a>
        )}
      </nav>
      <p className="mt-2 flex flex-wrap items-center justify-center gap-1 text-[11px] font-medium text-white/35">
        <span>© {year} {siteConfig.siteName}</span>
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-1">
          Made with <Heart size={10} className="text-uno-red" /> for card game fans
        </span>
      </p>
      <p className="mt-1 text-[10px] leading-relaxed text-white/30">
        Fan-made UNO-style game. Not affiliated with, endorsed by, or sponsored by Mattel. UNO is a trademark of
        Mattel.
      </p>
    </footer>
  )
}
