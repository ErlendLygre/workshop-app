export interface Book {
  id: number
  title: string
  author: string | null
  isRead: boolean
  addedAt: string
}

export class UnauthorizedError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (response.status === 401) throw new UnauthorizedError('Not logged in')
  if (response.status === 429) throw new Error('Too many attempts. Wait a minute and try again.')
  if (!response.ok) {
    const problem = await response.json().catch(() => null)
    const firstError = problem?.errors && Object.values(problem.errors as Record<string, string[]>)[0]?.[0]
    throw new Error(firstError ?? problem?.title ?? `Request failed (${response.status})`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  isLoggedIn: async () => {
    try {
      await request<void>('/api/auth/me')
      return true
    } catch (error) {
      if (error instanceof UnauthorizedError) return false
      throw error
    }
  },
  login: async (password: string) => {
    try {
      await request<void>('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) })
    } catch (error) {
      if (error instanceof UnauthorizedError) throw new Error('Wrong password')
      throw error
    }
  },
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  listBooks: () => request<Book[]>('/api/books'),
  addBook: (title: string, author: string) =>
    request<Book>('/api/books', { method: 'POST', body: JSON.stringify({ title, author }) }),
  setRead: (id: number, isRead: boolean) =>
    request<Book>(`/api/books/${id}`, { method: 'PATCH', body: JSON.stringify({ isRead }) }),
  deleteBook: (id: number) => request<void>(`/api/books/${id}`, { method: 'DELETE' }),
}
