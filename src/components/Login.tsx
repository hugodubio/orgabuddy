import { useAuthStore } from '../store/auth'

const USERS = [
  { id: 'hugo', name: 'Hugo', initials: 'HU', color: '#cf6424' },
  { id: 'ze',   name: 'Zé',   initials: 'ZÉ', color: '#0ea5e9' },
  { id: 'lisa', name: 'Lisa', initials: 'LI', color: '#a855f7' },
]

export default function Login() {
  const { setUser } = useAuthStore()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10"
      style={{ background: 'var(--bg)' }}>
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'var(--amber)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
          <span className="text-white text-[11px] font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>O</span>
        </div>
        <h1 className="text-[28px]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-1)' }}>
          OrgaBuddy
        </h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text-3)' }}>Quem és tu?</p>
      </div>

      <div className="flex gap-4">
        {USERS.map((u) => (
          <button
            key={u.id}
            onClick={() => setUser(u.id, u.name)}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl transition-all hover:scale-105 active:scale-95"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', minWidth: 100 }}
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-[16px] font-bold"
              style={{ background: u.color, fontFamily: 'Inter, sans-serif' }}>
              {u.initials}
            </div>
            <span className="text-[14px] font-semibold" style={{ color: 'var(--text-1)' }}>{u.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
