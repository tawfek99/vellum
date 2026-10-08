/**
 * Minimal className combiner. Filters out falsy values so callers can write
 * `cn('base', isActive && 'active')`. Intentionally dependency-free.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
