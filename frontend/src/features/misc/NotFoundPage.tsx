import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-md py-16 text-center">
      <p className="text-sm font-semibold text-neutral-500">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm text-neutral-600">
        The page you are looking for does not exist or has moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
      >
        Back to dashboard
      </Link>
    </section>
  )
}
