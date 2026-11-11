import { useState, type FormEvent } from 'react'
import { api } from '../api'

export function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.login(password)
      onLoggedIn()
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <form className="card login" onSubmit={submit}>
      <h1>Home Library</h1>
      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" disabled={busy || password.length === 0}>
        {busy ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  )
}
