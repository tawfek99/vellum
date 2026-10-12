/** Formats an ISO timestamp as a short relative time (e.g. "3 minutes ago"). */
export function formatRelative(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''

  const diffSeconds = Math.round((then - now) / 1000)
  const abs = Math.abs(diffSeconds)
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

  if (abs < 60) return formatter.format(diffSeconds, 'second')
  if (abs < 3600) return formatter.format(Math.round(diffSeconds / 60), 'minute')
  if (abs < 86_400) return formatter.format(Math.round(diffSeconds / 3600), 'hour')
  if (abs < 604_800) return formatter.format(Math.round(diffSeconds / 86_400), 'day')
  return new Date(iso).toLocaleDateString()
}
