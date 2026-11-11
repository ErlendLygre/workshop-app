import type { Book } from '../api'

interface Props {
  books: Book[]
  onToggleRead: (book: Book) => void
  onDelete: (book: Book) => void
}

export function BookList({ books, onToggleRead, onDelete }: Props) {
  if (books.length === 0) {
    return <p className="empty">No books here yet.</p>
  }

  return (
    <ul className="books">
      {books.map((book) => (
        <li key={book.id} className={book.isRead ? 'read' : undefined}>
          <label className="read-toggle">
            <input type="checkbox" checked={book.isRead} onChange={() => onToggleRead(book)} />
            <span className="visually-hidden">Mark “{book.title}” as {book.isRead ? 'unread' : 'read'}</span>
          </label>
          <div className="book-text">
            <span className="title">{book.title}</span>
            {book.author && <span className="author">{book.author}</span>}
          </div>
          <span className={`badge ${book.isRead ? 'badge-read' : 'badge-unread'}`}>
            {book.isRead ? 'Read' : 'Unread'}
          </span>
          <button className="delete" onClick={() => onDelete(book)} aria-label={`Remove “${book.title}”`}>
            Remove
          </button>
        </li>
      ))}
    </ul>
  )
}
