import { useState } from 'react'
import { getReminderHours, setReminderHours, requestNotificationPermission } from '../hooks/useReminders'

export default function NotificationSettings() {
  const saved = getReminderHours()
  const [morning, setMorning] = useState(String(saved.morning))
  const [evening, setEvening] = useState(String(saved.evening))
  const [permission, setPermission] = useState(() =>
    'Notification' in window ? Notification.permission : 'unsupported'
  )
  const [saved2, setSaved2] = useState(false)

  const handleSave = () => {
    setReminderHours(parseInt(morning), parseInt(evening))
    setSaved2(true)
    setTimeout(() => setSaved2(false), 2000)
  }

  const handleRequest = async () => {
    const granted = await requestNotificationPermission()
    setPermission(granted ? 'granted' : 'denied')
  }

  if (permission === 'unsupported') return null

  return (
    <div className="rounded-xl px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p className="text-[12px] font-bold mb-3 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
        Lembretes
      </p>

      {permission !== 'granted' ? (
        <div>
          <p className="text-[13px] mb-2" style={{ color: 'var(--text-2)' }}>
            {permission === 'denied'
              ? 'Notificações bloqueadas. Activa nas definições do browser.'
              : 'Activa notificações para receberes lembretes.'}
          </p>
          {permission !== 'denied' && (
            <button onClick={handleRequest}
              className="px-3 py-2 rounded-xl text-[12px] font-semibold"
              style={{ background: 'var(--brand-primary)', color: '#fff' }}>
              Activar notificações
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <label className="text-[13px] flex-1" style={{ color: 'var(--text-2)' }}>Manhã</label>
            <select value={morning} onChange={(e) => setMorning(e.target.value)}
              className="px-2 py-1.5 rounded-lg text-[13px] outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
              {Array.from({ length: 13 }, (_, i) => i + 6).map((h) => (
                <option key={h} value={h}>{String(h).padStart(2,'0')}:00</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[13px] flex-1" style={{ color: 'var(--text-2)' }}>Tarde</label>
            <select value={evening} onChange={(e) => setEvening(e.target.value)}
              className="px-2 py-1.5 rounded-lg text-[13px] outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
              {Array.from({ length: 8 }, (_, i) => i + 14).map((h) => (
                <option key={h} value={h}>{String(h).padStart(2,'0')}:00</option>
              ))}
            </select>
          </div>
          <button onClick={handleSave}
            className="px-3 py-2 rounded-xl text-[12px] font-semibold mt-1 transition-colors"
            style={{ background: saved2 ? '#10b981' : 'var(--brand-primary)', color: '#fff' }}>
            {saved2 ? '✓ Guardado' : 'Guardar'}
          </button>
        </div>
      )}
    </div>
  )
}
