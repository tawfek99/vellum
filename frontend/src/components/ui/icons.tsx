import type { SVGProps } from 'react'

/** Eye icon — shown when a password field is hidden (click to reveal). */
export function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

/** Eye-off icon — shown when a password field is visible (click to hide). */
export function EyeOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 5.8A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.6 17.6 0 0 1-3.2 4.1" />
      <path d="M6.6 6.9A17.4 17.4 0 0 0 2.5 12S6 18.5 12 18.5a9.9 9.9 0 0 0 4-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  )
}
