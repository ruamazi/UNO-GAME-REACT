/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string
  readonly VITE_CONTACT_EMAIL?: string
  readonly VITE_SITE_NAME?: string
  readonly VITE_ADSENSE_CLIENT?: string
  readonly VITE_ADSENSE_SLOT_START_TOP?: string
  readonly VITE_ADSENSE_SLOT_START_BOTTOM?: string
  readonly VITE_ADSENSE_SLOT_GAME?: string
  readonly VITE_GOOGLE_CMP?: string
  readonly VITE_CUSTOM_CONSENT?: string
  readonly VITE_GA_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
