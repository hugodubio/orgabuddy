import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'
import type { CalendarEvent } from '../types'

// Shows events happening today or tomorrow — not tasks, just reminders
export default function UpcomingEvents({ compact = false }: { compact?: boolean }) {
  const { userId } = useAuthStore()
  const [events, setEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    if (!userId) return
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    supabase
      .from('ob_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_date', today)
      .lte('start_date', tomorrow)
      .order('start_date', { ascending: true })
      .then(({ data }) => setEvents((data ?? []) as CalendarEvent[]))
  }, [userId])

  if (events.length === 0) return null

  const today = new Date().toISOString().split('T')[0]

  if (compact) {
    // Used inside FocusMode (dark bg)
    return (
      <div className="flex flex-col gap-1.5 w-full max-w-sm">
        {events.map(e => {
          const isToday = e.start_date === today
          return (
            <div key={e.id}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px]"
              style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${isToday ? 'rgba(251,146,60,0.5)' : 'rgba(255,255,255,0.08)'}` }}>
              <span className="text-[14px]">{isToday ? '🔔' : '📅'}</span>
              <span className="flex-1 font-medium text-white truncate">{e.title}</span>
              <span className="shrink-0 font-semibold" style={{ color: isToday ? '#fb923c' : 'rgba(255,255,255,0.4)' }}>
                {isToday ? 'Hoje' : 'Amanhã'}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 mb-4">
      {events.map(e => {
        const isToday = e.start_date === today
        return (
          <div key={e.id}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px]"
            style={{
              background: isToday ? '#fff7ed' : 'var(--surface)',
              border: `1px solid ${isToday ? '#fdba74' : 'var(--border)'}`,
            }}>
            <span className="text-[15px]">{isToday ? '🔔' : '📅'}</span>
            <div className="flex-1 min-w-0">
              <span className="font-semibold" style={{ color: 'var(--text-1)' }}>{e.title}</span>
              {e.location && (
                <span className="ml-1.5 text-[11px]" style={{ color: 'var(--text-3)' }}>· {e.location}</span>
              )}
            </div>
            <span className="text-[11px] font-semibold shrink-0"
              style={{ color: isToday ? '#c2410c' : 'var(--text-3)' }}>
              {isToday ? 'Hoje' : 'Amanhã'}
            </span>
          </div>
        )
      })}
    </div>
  )
}
