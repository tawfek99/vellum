/** Small helpers for deriving a friendly display name / initials from user data. */

export function getDisplayName(email?: string | null, fallback = 'there'): string {
  const local = email?.split('@')[0]?.trim()
  if (!local) return fallback
  return local.charAt(0).toUpperCase() + local.slice(1)
}

export function getInitials(value: string): string {
  const cleaned = value.trim()
  if (!cleaned) return '?'
  const parts = cleaned.split(/[\s._@-]+/).filter(Boolean)
  const first = parts[0] ?? ''
  const second = parts[1] ?? ''
  const initials = `${first.charAt(0)}${second ? second.charAt(0) : ''}`.toUpperCase()
  return initials || '?'
}
