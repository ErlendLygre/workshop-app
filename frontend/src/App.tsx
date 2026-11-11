import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, UnauthorizedError, type Book } from './api'
import { BookForm } from './components/BookForm'
import { BookList } from './components/BookList'
import { LoginForm } from './components/LoginForm'

type Filter = 'all' | 'unread' | 'read'

export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [error, setError] = useState<string | null>(null)

  // Run an API call; if the session has expired, go back to the login screen.
  const run = useCallback(async (action: () => Promise<void>) => {
    setError(null)
    try {
      await action()
    } catch (e) {
      if (e instanceof UnauthorizedError) setLoggedIn(false)
      else setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    api.isLoggedIn().then(setLoggedIn, () => setError('Could not reach the server.'))
  }, [])

  useEffect(() => {
    if (!loggedIn) return
    api.listBooks().then(setBooks, (e: Error) => {
      if (e instanceof UnauthorizedError) setLoggedIn(false)
      else setError(e.message)
    })
  }, [loggedIn])

  const visibleBooks = useMemo(
    () => books.filter((b) => filter === 'all' || (filter === 'read') === b.isRead),
    [books, filter],
  )
  const readCount = books.filter((b) => b.isRead).length

  if (loggedIn === null) {
    return <main className="app">{error ? <p className="error">{error}</p> : <p>Loading…</p>}</main>
  }

  if (!loggedIn) {
    return (
      <main className="app">
        <LoginForm onLoggedIn={() => setLoggedIn(true)} />
      </main>
    )
  }

  const addBook = (title: string, author: string) =>
    run(async () => {
      const book = await api.addBook(title, author)
      setBooks((prev) => [...prev, book].sort((a, b) => a.title.localeCompare(b.title)))
    })

  // Update the UI immediately, and roll back if the server rejects the change.
  const toggleRead = (book: Book) => {
    const replace = (next: Book) => setBooks((prev) => prev.map((b) => (b.id === next.id ? next : b)))
    replace({ ...book, isRead: !book.isRead })
    run(async () => {
      try {
        replace(await api.setRead(book.id, !book.isRead))
      } catch (e) {
        replace(book)
        throw e
      }
    })
  }

  const deleteBook = (book: Book) => {
    if (!window.confirm(`Remove “${book.title}” from your library?`)) return
    run(async () => {
      await api.deleteBook(book.id)
      setBooks((prev) => prev.filter((b) => b.id !== book.id))
    })
  }

  const logout = () =>
    run(async () => {
      await api.logout()
      setBooks([])
      setLoggedIn(false)
    })

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: `All (${books.length})` },
    { value: 'unread', label: `Unread (${books.length - readCount})` },
    { value: 'read', label: `Read (${readCount})` },
  ]

  return (
    <main className="app">
      <header>
        <h1>Home Library</h1>
        <button className="link" onClick={logout}>
          Log out
        </button>
      </header>

      <BookForm onAdd={addBook} />

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <nav className="filters" aria-label="Filter books">
        {filters.map((f) => (
          <button
            key={f.value}
            className={filter === f.value ? 'active' : undefined}
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </nav>

      <BookList books={visibleBooks} onToggleRead={toggleRead} onDelete={deleteBook} />
    </main>
  )
}
