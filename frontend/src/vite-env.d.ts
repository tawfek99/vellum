/// <reference types="vite/client" />

/**
 * Typed Vite environment variables. Only `VITE_`-prefixed values are exposed to
 * the browser. Never add secrets (e.g. the Supabase secret key) here.
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  // Optional: when set, the login page shows a one-click "Try the demo" button.
  readonly VITE_DEMO_EMAIL?: string
  readonly VITE_DEMO_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
