import { useEffect, useState } from 'react'
import { useHabitsStore } from '../store/habits'

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  })
}

function getStreak(habitId: number, logs: { habit_id: number; date: string }[]): number {
  const done = new Set(logs.filter((l) => l.habit_id === habitId).map((l) => l.date))
  let streak = 0
  const d = new Date()
  while (done.has(d.toISOString().split('T')[0])) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export default function HabitsView() {
  const { habits, logs, toggling, fetchHabits, fetchLogs, addHabit, deleteHabit, toggleLog } = useHabitsStore()
  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')
  const days = getLast7Days()
  const today = days[0]

  useEffect(() => {
    fetchHabits()
    const since = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0]
    fetchLogs(since)
  }, [fetchHabits, fetchLogs])

  const handleAdd = async () => {
    const text = newText.trim()
    if (!text) return
    await addHabit(text)
    setNewText('')
    setAdding(false)
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[21px] md:text-[24px] font-extrabold" style={{ color: 'var(--text-1)', letterSpacing: '-0.04em' }}>
          Hábitos
        </h1>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold"
          style={{ background: 'var(--brand-primary)', color: '#fff' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
            <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Hábito
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="flex gap-2 mb-4">
          <input
            autoFocus
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') { setAdding(false); setNewText('') }
            }}
            placeholder="Nome do hábito…"
            className="flex-1 px-3 py-2.5 rounded-xl text-[14px] outline-none"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--amber)', color: 'var(--text-1)' }}
          />
          <button onClick={handleAdd} disabled={!newText.trim()}
            className="px-4 py-2.5 rounded-xl text-[13px] font-semibold disabled:opacity-40"
            style={{ background: 'var(--brand-primary)', color: '#fff' }}>
            Guardar
          </button>
          <button onClick={() => { setAdding(false); setNewText('') }}
            className="px-3 py-2.5 rounded-xl text-[13px]"
            style={{ color: 'var(--text-3)' }}>
            ×
          </button>
        </div>
      )}

      {/* Empty state */}
      {habits.length === 0 && !adding && (
        <div className="text-center py-20">
          <p className="text-[32px] mb-3">🌱</p>
          <p className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Sem hábitos ainda</p>
          <p className="text-[13px] mb-5" style={{ color: 'var(--text-3)' }}>Adiciona o primeiro para começar a acompanhar</p>
          <button onClick={() => setAdding(true)}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold"
            style={{ background: 'var(--brand-primary)', color: '#fff' }}>
            + Novo hábito
          </button>
        </div>
      )}

      {/* Day headers */}
      {habits.length > 0 && (
        <div className="mb-2 flex items-center gap-2 pr-8">
          <div className="flex-1" />
          {days.map((d) => {
            const dow = new Date(d + 'T12:00:00').getDay()
            const isToday = d === today
            return (
              <div key={d} className="w-8 text-center">
                <p className="text-[10px] font-semibold uppercase"
                  style={{ color: isToday ? 'var(--amber)' : 'var(--text-3)' }}>
                  {DAY_LABELS[dow]}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Habit rows */}
      <div className="flex flex-col gap-1">
        {habits.map((habit) => {
          const streak = getStreak(habit.id, logs)
          return (
            <div key={habit.id}
              className="flex items-center gap-2 px-3 py-3 rounded-xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

              {/* Dot + name */}
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: habit.color }} />
              <span className="flex-1 text-[14px] font-medium truncate" style={{ color: 'var(--text-1)' }}>
                {habit.text}
              </span>

              {/* Streak */}
              {streak > 1 && (
                <span className="text-[11px] font-bold shrink-0" style={{ color: habit.color }}>
                  {streak}🔥
                </span>
              )}

              {/* Day circles */}
              {days.map((d) => {
                const key = `${habit.id}-${d}`
                const done = logs.some((l) => l.habit_id === habit.id && l.date === d)
                const isToday = d === today
                const busy = toggling.has(key)
                return (
                  <button
                    key={d}
                    onClick={() => toggleLog(habit.id, d)}
                    disabled={busy}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-50 shrink-0"
                    style={done
                      ? { background: habit.color, border: `2px solid ${habit.color}` }
                      : { background: 'transparent', border: isToday ? `2px solid var(--brand-primary)` : `1.5px solid var(--border)` }
                    }
                  >
                    {done && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l2.5 2.5L10 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    )}
                  </button>
                )
              })}

              {/* Delete */}
              <button
                onClick={() => deleteHabit(habit.id)}
                className="w-6 h-6 flex items-center justify-center rounded text-[16px] leading-none shrink-0 transition-colors"
                style={{ color: 'var(--text-3)' }}
              >×</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
