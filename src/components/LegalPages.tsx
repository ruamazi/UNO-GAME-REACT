import { ArrowLeft, Mail, Play, ShieldCheck, Sparkles } from 'lucide-react'
import { siteConfig } from '../config'
import { SiteFooter } from './SiteFooter'

type LegalRoute = 'about' | 'privacy' | 'terms' | 'contact'

const EFFECTIVE_DATE = 'October 20, 2026'

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold text-uno-yellow underline decoration-uno-yellow/40 underline-offset-2 hover:decoration-uno-yellow">
      {children}
    </a>
  )
}

function AboutContent() {
  return (
    <>
      <h1>About UNO Classic</h1>
      <p className="legal-lead">
        UNO Classic is a free, browser-based card game built for quick breaks and long rematches. It follows the
        classic colour-and-symbol matching rules, adds a few optional house rules, and puts you against up to five AI
        opponents.
      </p>

      <h2>What is included</h2>
      <ul>
        <li>2–6 player matches with five distinct AI personalities and two difficulty levels.</li>
        <li>Skip, Reverse, Draw Two, Wild and Wild Draw Four cards with official scoring.</li>
        <li>Optional stacking, draw-until-playable and strict Wild Draw Four/challenge rules.</li>
        <li>UNO calls and catches, round summaries and a first-to-target-score match.</li>
        <li>Auto-save: close the tab and resume your match later on the same device.</li>
        <li>Responsive layout, keyboard-friendly controls, sound effects and reduced-motion support.</li>
        <li>Installable as an app on supported browsers.</li>
      </ul>

      <h2>How matches work</h2>
      <p>
        Every player starts with seven cards. Match the top discard by colour, number or symbol. Action cards change
        the pace; Wild cards let you choose the next colour. When you are down to one card, call UNO before your
        opponents catch you. The round winner scores the value of every card left in the other hands: numbers are face
        value, action cards are 20 points, and wild cards are 50 points. The first player to reach the target score wins
        the match.
      </p>

      <h2>No account, no downloads</h2>
      <p>
        The game runs entirely in your browser. There is no sign-up, no chat, and no personal profile. Your settings,
        current match and consent choice are stored locally on your device. Google AdSense and, if enabled, Google
        Analytics are the only third-party services that may receive data — and only according to your cookie choices.
      </p>

      <h2>Why there are ads</h2>
      <p>
        Ads keep the game free and pay for hosting. They are placed outside the play area so they never cover cards or
        controls. You can change your advertising and analytics choices at any time using the{' '}
        <strong>Cookie settings</strong> link in the footer.
      </p>

      <h2>Trademark notice</h2>
      <p>
        This is an independent fan-made game inspired by the classic UNO card game. It is not affiliated with,
        endorsed by, or sponsored by Mattel. UNO is a trademark of Mattel. All original code and artwork in this
        project belong to their respective authors.
      </p>
    </>
  )
}

function PrivacyContent() {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-uno-green/40 bg-uno-green/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-200">
          <ShieldCheck size={12} /> Privacy first
        </span>
        <span className="text-xs text-white/45">Effective {EFFECTIVE_DATE}</span>
      </div>

      <h1>Privacy Policy</h1>
      <p className="legal-lead">
        This policy explains what information UNO Classic stores, what Google AdSense and Google Analytics may collect,
        and the choices you have. We keep data collection to the minimum needed to run a free game.
      </p>

      <h2>Who we are</h2>
      <p>
        UNO Classic is a free browser game operated by the site owner. For privacy questions or requests, contact{' '}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>. This policy applies to the game at{' '}
        {siteConfig.siteUrl || 'this website'} and its pages.
      </p>

      <h2>Information stored on your device</h2>
      <p>
        The game uses your browser's local storage for essential functionality. This information stays on your device
        and is not transmitted to our servers:
      </p>
      <ul>
        <li>
          <strong>Game settings</strong> — player name, avatar, player count, target score and house rules.
        </li>
        <li>
          <strong>Saved match</strong> — the current game state so you can continue after closing the tab.
        </li>
        <li>
          <strong>Consent choice</strong> — which optional categories you accepted or rejected.
        </li>
      </ul>
      <p>
        You can delete this data at any time by clearing site data in your browser. Doing so removes your saved match
        and settings.
      </p>

      <h2>Analytics</h2>
      <p>
        If analytics is enabled and you consent, we use Google Analytics 4 to understand aggregate usage — for example,
        which screens are visited and whether games are completed. Analytics may collect a truncated IP address,
        approximate location, device/browser information, and interaction events. We do not use analytics to identify
        you personally, and we do not sell this data.
      </p>
      <p>
        Analytics loads only after you select <strong>Accept all</strong> or enable the Analytics toggle. You can
        withdraw consent at any time through <strong>Cookie settings</strong>.
      </p>

      <h2>Advertising and Google AdSense</h2>
      <p>
        This site uses Google AdSense to display advertisements. Third-party vendors, including Google, use cookies to
        serve ads based on your prior visits to this website or other websites. Google's use of advertising cookies
        enables it and its partners to serve ads to you based on your visits to this site and/or other sites on the
        Internet.
      </p>
      <ul>
        <li>
          You may opt out of personalised advertising by visiting{' '}
          <ExternalLink href="https://www.google.com/settings/ads">Google Ads Settings</ExternalLink>.
        </li>
        <li>
          You can also opt out of some third-party vendors' use of cookies for personalised advertising at{' '}
          <ExternalLink href="https://www.aboutads.info/choices/">aboutads.info/choices</ExternalLink>.
        </li>
        <li>
          Learn more in <ExternalLink href="https://policies.google.com/technologies/ads">Google's advertising policies</ExternalLink>{' '}
          and <ExternalLink href="https://policies.google.com/privacy">Google's Privacy Policy</ExternalLink>.
        </li>
      </ul>
      <p>
        Ads are only requested after you grant advertising consent, unless you are covered by Google's certified
        consent management platform. Google may use cookies such as <code>__gads</code>, <code>__gpi</code> and
        <code>IDE</code> for ad delivery, frequency capping, fraud prevention and measurement. These cookies are
        controlled by Google, not by this game.
      </p>

      <h2>Cookies and consent</h2>
      <ul>
        <li>
          <strong>Essential</strong> — local storage for settings, saves and your consent choice. No consent is needed
          because these are required for the game to work.
        </li>
        <li>
          <strong>Advertising</strong> — Google AdSense cookies used to show and measure ads. Optional.
        </li>
        <li>
          <strong>Analytics</strong> — Google Analytics cookies used for aggregate usage statistics. Optional.
        </li>
      </ul>
      <p>
        We use Google Consent Mode so advertising and analytics storage remain denied until you make a choice. If you
        are in the EEA or UK and Google's certified consent management platform is enabled, Google may present its own
        consent message and record your choice.
      </p>

      <h2>Legal bases (EEA/UK)</h2>
      <p>
        Where GDPR applies, we rely on your consent for advertising and analytics, and on legitimate interests for the
        essential operation, security and fraud prevention of the site. You can withdraw consent at any time.
      </p>

      <h2>Your privacy rights</h2>
      <p>
        Depending on where you live, you may have the right to access, correct, delete, restrict or object to the
        processing of your personal data, and to data portability. Because the game has no accounts and stores game
        data only in your browser, most requests can be handled by clearing site data. For anything else, email{' '}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>. You also have the right to
        complain to your local data protection authority.
      </p>
      <p>
        <strong>California residents:</strong> we do not sell personal information for money. Advertising and analytics
        partners may process data as described above; use <strong>Cookie settings</strong> to opt out of optional
        categories.
      </p>

      <h2>Children's privacy</h2>
      <p>
        The game is not directed to children under 13, and we do not knowingly collect personal information from
        children. There are no accounts or chat features. If you believe a child's information has been provided to us,
        contact us and we will delete it.
      </p>

      <h2>Data retention and security</h2>
      <p>
        Game data stays in your browser until you clear it. Google retains advertising and analytics data according to
        its own policies. We use HTTPS in production and keep the site's dependencies up to date, but no website can
        guarantee absolute security.
      </p>

      <h2>Third-party links</h2>
      <p>
        This site may link to external websites. We are not responsible for their content or privacy practices. Review
        their policies before providing personal information.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy when the game or legal requirements change. The effective date at the top will be
        updated, and material changes will be highlighted on the site.
      </p>

      <h2>Contact</h2>
      <p>
        Questions, data requests or concerns: <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
      </p>
    </>
  )
}

function TermsContent() {
  return (
    <>
      <h1>Terms of Use</h1>
      <p className="legal-lead">
        By accessing or playing UNO Classic, you agree to these terms. If you do not agree, please do not use the site.
        These terms are a simple agreement covering a free browser game; they are not legal advice.
      </p>

      <h2>1. The service</h2>
      <p>
        UNO Classic is a free, single-player browser card game. No account is required. The game is provided for
        personal, non-commercial entertainment. We may change, suspend or discontinue any part of the service at any
        time.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 13 years old, or have permission from a parent or guardian, to use the site. If you are
        under the age of majority where you live, you confirm that a parent or guardian has reviewed these terms with
        you.
      </p>

      <h2>3. Licence to use</h2>
      <p>
        We grant you a limited, non-exclusive, non-transferable, revocable licence to access and play the game for your
        personal enjoyment. You may not resell, sublicense or commercially exploit the game or its assets without
        written permission.
      </p>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use bots, scripts or automation to play or manipulate the game.</li>
        <li>Attempt to disrupt, overload, scrape or reverse engineer the site or its security measures.</li>
        <li>Interfere with advertising, or use ad-blocking in a way that violates applicable law.</li>
        <li>Upload or transmit malicious code, or use the site for unlawful purposes.</li>
        <li>Remove copyright, trademark or attribution notices.</li>
      </ul>

      <h2>5. Advertising and third-party services</h2>
      <p>
        The game is supported by advertising, including Google AdSense. Ads are provided by third parties, and we do
        not control their content. Your interactions with advertisers are solely between you and the advertiser. See
        the <a href="#/privacy">Privacy Policy</a> for cookie and data choices.
      </p>

      <h2>6. Intellectual property</h2>
      <p>
        The game's original code, artwork, audio and branding are owned by their respective authors and protected by
        copyright. UNO is a trademark of Mattel. This is an independent fan-made game and is not affiliated with,
        endorsed by, or sponsored by Mattel. Other names and logos are the property of their owners.
      </p>

      <h2>7. Availability and changes</h2>
      <p>
        The game is provided on an “as is” and “as available” basis. We do not guarantee uninterrupted access, that
        saves will never be lost, or that the game will be free from errors. Features, rules and content may change
        without notice.
      </p>

      <h2>8. Disclaimer of warranties</h2>
      <p>
        To the maximum extent permitted by law, we disclaim all warranties, express or implied, including
        merchantability, fitness for a particular purpose and non-infringement. You use the game at your own risk.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, we are not liable for indirect, incidental, special, consequential or
        punitive damages, or for lost data, profits or goodwill, arising from your use of or inability to use the game.
        Nothing in these terms limits rights that cannot be limited by law.
      </p>

      <h2>10. Indemnity</h2>
      <p>
        You agree to indemnify and hold harmless the site operator from claims arising from your misuse of the game or
        violation of these terms.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These terms are governed by the laws applicable in the operator's jurisdiction, without regard to conflict of
        law rules. Any dispute will be handled by the competent courts of that jurisdiction, unless mandatory consumer
        law provides otherwise.
      </p>

      <h2>12. Changes to these terms</h2>
      <p>
        We may update these terms from time to time. The effective date will be revised, and continued use after a
        change means you accept the updated terms.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these terms: <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
      </p>
    </>
  )
}

function ContactContent() {
  return (
    <>
      <h1>Contact</h1>
      <p className="legal-lead">
        Found a bug, have an idea for a house rule, or need help with privacy or advertising choices? We would love to
        hear from you.
      </p>

      <div className="not-prose my-6 rounded-2xl border border-uno-yellow/30 bg-uno-yellow/10 p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-white">
          <Mail size={16} className="text-uno-yellow" /> Email
        </p>
        <a
          href={`mailto:${siteConfig.contactEmail}`}
          className="mt-1 block break-all text-lg font-semibold text-uno-yellow underline decoration-uno-yellow/40 underline-offset-4"
        >
          {siteConfig.contactEmail}
        </a>
        <p className="mt-2 text-xs text-white/55">We usually reply within 2–5 business days.</p>
      </div>

      <h2>Bug reports</h2>
      <p>
        Please include your browser and device, what you expected to happen, what actually happened, and (if possible)
        the round number and the last few log entries from the in-game activity panel. Screenshots help a lot.
      </p>

      <h2>Privacy and advertising requests</h2>
      <p>
        For access, deletion or consent questions, use the same email and mention “Privacy request” in the subject.
        Since the game has no accounts, most data lives only in your browser and can be cleared from your browser's
        site settings.
      </p>

      <h2>Business and feedback</h2>
      <p>
        For partnership, advertising or press enquiries, email us with a short description and relevant links. We read
        every message, even when we cannot reply individually.
      </p>
    </>
  )
}

const CONTENT: Record<LegalRoute, { title: string; element: React.ReactNode }> = {
  about: { title: 'About', element: <AboutContent /> },
  privacy: { title: 'Privacy Policy', element: <PrivacyContent /> },
  terms: { title: 'Terms of Use', element: <TermsContent /> },
  contact: { title: 'Contact', element: <ContactContent /> },
}

export function LegalPage({ route }: { route: LegalRoute }) {
  const content = CONTENT[route]

  return (
    <div className="table-felt vignette relative h-full overflow-y-auto">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-40 -translate-x-1/2 select-none font-display text-[26vw] leading-none text-white/[0.025]"
      >
        UNO
      </span>

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-8 pt-5 sm:px-6 sm:pt-8">
        <header className="flex items-center justify-between gap-3">
          <a
            href="#/"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white/80 transition-colors hover:bg-black/50 hover:text-white"
          >
            <ArrowLeft size={14} /> Back to game
          </a>
          <a href="#/" className="font-display text-2xl tracking-wide text-white drop-shadow">
            UNO
          </a>
        </header>

        <main className="glass mt-5 rounded-2xl p-5 shadow-2xl sm:p-8">
          <div className="legal-prose">{content.element}</div>

          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
            <p className="flex items-center gap-2 text-xs text-white/45">
              <Sparkles size={13} className="text-uno-yellow" /> Free to play · no account needed
            </p>
            <a
              href="#/"
              className="inline-flex items-center gap-2 rounded-xl bg-uno-yellow px-5 py-2.5 text-sm font-black uppercase tracking-wide text-uno-black shadow-[0_4px_0_#b8860b] transition-all hover:bg-yellow-300 active:translate-y-[3px] active:shadow-none"
            >
              <Play size={16} /> Play now
            </a>
          </div>
        </main>

        <nav aria-label="Legal pages" className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11px] font-bold uppercase tracking-wider text-white/50">
          <a href="#/about" className={route === 'about' ? 'text-uno-yellow' : 'hover:text-white'}>
            About
          </a>
          <a href="#/privacy" className={route === 'privacy' ? 'text-uno-yellow' : 'hover:text-white'}>
            Privacy
          </a>
          <a href="#/terms" className={route === 'terms' ? 'text-uno-yellow' : 'hover:text-white'}>
            Terms
          </a>
          <a href="#/contact" className={route === 'contact' ? 'text-uno-yellow' : 'hover:text-white'}>
            Contact
          </a>
        </nav>

        <SiteFooter compact />
      </div>
    </div>
  )
}
