import { ApiError, apiFetch } from '@/lib/api/client'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))

vi.mock('@/lib/supabase', () => ({ supabase: { auth: { getSession } } }))
vi.mock('@/config/env', () => ({ env: { apiBaseUrl: 'http://api.test' } }))

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('apiFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('attaches the bearer token and returns parsed JSON', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok-123' } } })
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ id: 'f1' }]))
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiFetch<Array<{ id: string }>>('/folders')

    expect(result).toEqual([{ id: 'f1' }])
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://api.test/folders')
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer tok-123')
  })

  it('throws ApiError using the API detail message', async () => {
    getSession.mockResolvedValue({ data: { session: null } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ detail: 'Nope' }, 401)))

    await expect(apiFetch('/folders')).rejects.toMatchObject({ status: 401, message: 'Nope' })
    await expect(apiFetch('/folders')).rejects.toBeInstanceOf(ApiError)
  })
})
