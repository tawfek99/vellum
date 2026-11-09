import { useState } from 'react'
import type { FormEvent } from 'react'
import { Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { env } from '@/config/env'
import { supabase } from '@/lib/supabase'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [demoSubmitting, setDemoSubmitting] = useState(false)
  const demoAvailable = Boolean(env.demoEmail && env.demoPassword)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    setError(null)
    setSubmitting(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError('We could not sign you in. Check your email and password and try again.')
      setSubmitting(false)
      return
    }

    navigate('/', { replace: true })
  }

  async function handleDemo() {
    if (!env.demoEmail || !env.demoPassword || demoSubmitting || submitting) return

    setError(null)
    setDemoSubmitting(true)

    const { error: demoError } = await supabase.auth.signInWithPassword({
      email: env.demoEmail,
      password: env.demoPassword,
    })

    if (demoError) {
      setError('The demo is unavailable right now. Please try again in a moment.')
      setDemoSubmitting(false)
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <main className="flex min-h-full items-center justify-center bg-cream-100 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-parchment-200 bg-parchment-50 p-8 shadow-[0_24px_60px_-30px_rgba(61,45,28,0.45)] sm:p-10">
        <p className="font-serif text-base font-semibold tracking-tight text-ink-900">Note Taker</p>

        <h1 className="mt-7 font-serif text-3xl font-semibold tracking-tight text-ink-900">
          Welcome
        </h1>
        <p className="mt-2 text-sm text-ink-500">Sign in to continue.</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-brick-600/25 bg-brick-50 px-3.5 py-2.5 text-sm text-brick-600"
            >
              {error}
            </p>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-ink-700">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-ink-700">
              Password
            </label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting || demoSubmitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        {demoAvailable ? (
          <>
            <div className="mt-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-parchment-200" aria-hidden="true" />
              <span className="text-xs text-ink-400">or</span>
              <span className="h-px flex-1 bg-parchment-200" aria-hidden="true" />
            </div>

            <Button
              type="button"
              variant="secondary"
              className="mt-4 w-full"
              onClick={handleDemo}
              disabled={demoSubmitting || submitting}
            >
              <Sparkles className="size-4" aria-hidden="true" />
              {demoSubmitting ? 'Opening the demo…' : 'Try the demo'}
            </Button>
            <p className="mt-2 text-center text-xs text-ink-400">
              Explore sample notes and documents — no account needed.
            </p>
          </>
        ) : null}
      </div>
    </main>
  )
}
