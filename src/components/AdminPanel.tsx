import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/auth'
import { supabase } from '../lib/supabase'

interface OrgaUser {
  id: string
  name: string
  role: string
  created_at: string
}

export default function AdminPanel() {
  const { createUser } = useAuthStore()
  const [users, setUsers] = useState<OrgaUser[]>([])
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'user' | 'admin'>('user')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const fetchUsers = async () => {
    const { data } = await supabase.from('ob_users').select('id, name, role, created_at').order('created_at')
    setUsers(data ?? [])
  }

  useEffect(() => { fetchUsers() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    const { error } = await createUser(id, name || id, password, role)
    if (error) { setError(error); setLoading(false); return }
    setSuccess(true)
    setId(''); setName(''); setPassword(''); setRole('user')
    setLoading(false)
    fetchUsers()
  }

  const deleteUser = async (userId: string) => {
    if (!confirm(`Apagar ${userId}?`)) return
    await supabase.from('ob_users').delete().eq('id', userId)
    fetchUsers()
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-[18px] font-bold mb-6" style={{ color: 'var(--text-1)' }}>Utilizadores</h2>

      {/* User list */}
      <div className="flex flex-col gap-2 mb-8">
        {users.map(u => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div>
              <span className="text-[14px] font-semibold" style={{ color: 'var(--text-1)' }}>{u.name}</span>
              <span className="ml-2 text-[11px]" style={{ color: 'var(--text-3)' }}>@{u.id}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] px-2 py-0.5 rounded-full"
                style={{ background: u.role === 'admin' ? 'var(--amber)' : 'var(--border)', color: u.role === 'admin' ? '#fff' : 'var(--text-2)' }}>
                {u.role}
              </span>
              <button onClick={() => deleteUser(u.id)}
                className="text-[11px] opacity-40 hover:opacity-80 transition-opacity"
                style={{ color: 'var(--text-2)' }}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {/* Create user form */}
      <h3 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text-2)' }}>Novo utilizador</h3>
      <form onSubmit={handleCreate} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input type="text" placeholder="username" value={id} onChange={e => setId(e.target.value)}
            autoCapitalize="none"
            className="flex-1 px-3 py-2.5 rounded-xl text-[13px] outline-none"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-1)' }} />
          <input type="text" placeholder="Nome" value={name} onChange={e => setName(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl text-[13px] outline-none"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-1)' }} />
        </div>
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-[13px] outline-none"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-1)' }} />
        <div className="flex gap-2 items-center">
          <select value={role} onChange={e => setRole(e.target.value as 'user' | 'admin')}
            className="px-3 py-2.5 rounded-xl text-[13px] outline-none"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-1)' }}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <button type="submit" disabled={loading || !id || !password}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-opacity disabled:opacity-40"
            style={{ background: 'var(--amber)', color: '#fff' }}>
            {loading ? '...' : 'Criar'}
          </button>
        </div>
        {error && <p className="text-[12px]" style={{ color: '#e05a2b' }}>{error}</p>}
        {success && <p className="text-[12px]" style={{ color: '#16a34a' }}>Utilizador criado!</p>}
      </form>
    </div>
  )
}
