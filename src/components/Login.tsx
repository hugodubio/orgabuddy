import { useState } from 'react'
import { useAuthStore } from '../store/auth'
import { supabase } from '../lib/supabase'

export default function Login() {
  const { login, createUser } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isSetup, setIsSetup] = useState<boolean | null>(null)

  // Check if first run (no users exist)
  useState(() => {
    supabase.from('ob_users').select('id', { count: 'exact', head: true }).then(({ count }) => {
      setIsSetup(count === 0)
    })
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (isSetup) {
      // First run: create admin
      const { error } = await createUser(username, username, password, 'admin')
      if (error) { setError(error); setLoading(false); return }
      const { error: loginErr } = await login(username, password)
      if (loginErr) { setError(loginErr); setLoading(false); return }
    } else {
      const { error } = await login(username, password)
      if (error) { setError(error); setLoading(false); return }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8"
      style={{ background: 'var(--bg)' }}>
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'var(--amber)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
          <span className="text-white text-[11px] font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>O</span>
        </div>
        <h1 className="text-[28px]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-1)' }}>
          OrgaBuddy
        </h1>
        {isSetup && (
          <p className="text-[12px] mt-1 px-4 rounded-full py-1 inline-block"
            style={{ background: 'var(--amber)', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}>
            Primeira vez — cria a conta admin
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-[280px]">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoFocus
          autoCapitalize="none"
          className="px-4 py-3 rounded-xl text-[14px] outline-none"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-1)' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="px-4 py-3 rounded-xl text-[14px] outline-none"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-1)' }}
        />
        {error && (
          <p className="text-[12px] text-center" style={{ color: '#e05a2b' }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || !username || !password}
          className="py-3 rounded-xl text-[14px] font-semibold transition-opacity disabled:opacity-40"
          style={{ background: 'var(--amber)', color: '#fff' }}
        >
          {loading ? '...' : isSetup ? 'Criar conta' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
