/**
 * Typed, validated access to environment variables.
 *
 * Fails fast at startup if a required value is missing, so a misconfigured
 * deployment surfaces immediately instead of producing confusing runtime errors.
 * Import this module instead of touching `import.meta.env` directly.
 */

function requireValue(name: keyof ImportMetaEnv, value: string | undefined): string {
  if (value === undefined || value.trim() === '') {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        'Copy .env.example to .env and fill in the values.',
    )
  }
  return value
}

export const env = {
  apiBaseUrl: requireValue('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL),
  supabaseUrl: requireValue('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: requireValue('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY),
  // Optional demo credentials (public by design; the account only sees seeded data).
  demoEmail: import.meta.env.VITE_DEMO_EMAIL?.trim() || null,
  demoPassword: import.meta.env.VITE_DEMO_PASSWORD || null,
} as const
