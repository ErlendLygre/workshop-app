import { useState, type FormEvent } from 'react'

export function BookForm({ onAdd }: { onAdd: (title: string, author: string) => Promise<void> }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      await onAdd(title, author)
      setTitle('')
      setAuthor('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card add-book" onSubmit={submit}>
      <input
        aria-label="Title"
        placeholder="Title"
        maxLength={300}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        aria-label="Author"
        placeholder="Author (optional)"
        maxLength={200}
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />
      <button type="submit" disabled={busy || title.trim().length === 0}>
        Add book
      </button>
    </form>
  )
}
