import { useEffect, useState } from 'react'
import { useHabitsStore } from '../store/habits'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function dateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function addDays(base: Date, n: number) {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}

function streak(habitId: number, logs: { habit_id: number; date: string }[], today: string): number {
  const doneDates = new Set(logs.filter((l) => l.habit_id === habitId).map((l) => l.date))
  let count = 0
  let d = new Date(today)
  // If today not done yet, start from yesterday
  if (!doneDates.has(today)) d = addDays(d, -1)
  while (doneDates.has(dateStr(d))) {
    count++
    d = addDays(d, -1)
  }
  return count
}

export default function ClimbsView() {
  const { habits, logs, fetchHabits, fetchLogs, addHabit, deleteHabit, toggleLog } = useHabitsStore()
  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')
  const [hoveredHabit, setHoveredHabit] = useState<number | null>(null)

  const today = dateStr(new Date())

  // Last 35 days for the grid
  const days35: string[] = []
  for (let i = 34; i >= 0; i--) {
    days35.push(dateStr(addDays(new Date(), -i)))
  }

  const since = days35[0]

  useEffect(() => {
    fetchHabits()
    fetchLogs(since)
  }, [fetchHabits, fetchLogs, since])

  const isDone = (habitId: number, date: string) =>
    logs.some((l) => l.habit_id === habitId && l.date === date)

  const handleAdd = async () => {
    const text = newText.trim()
    if (!text) return
    await addHabit(text)
    setNewText('')
    setAdding(false)
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[22px] font-semibold text-[#1a1a1a]">Climbs</h1>
        <button
          onClick={() => { setAdding(true); setNewText('') }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-[#1a1a1a] text-white rounded-lg hover:bg-[#333] transition-colors"
        >
          <span className="text-[16px] leading-none">+</span>
          Novo hábito
        </button>
      </div>

      {/* Inline add */}
      {adding && (
        <div className="mb-6 flex gap-2">
          <input
            autoFocus
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') setAdding(false)
            }}
            placeholder="Nome do hábito…"
            className="flex-1 bg-[#f7f7f5] border border-[#d0d0ce] rounded-lg px-3 py-2 text-[13px] outline-none"
          />
          <button
            onClick={handleAdd}
            disabled={!newText.trim()}
            className="px-4 py-2 text-[12px] bg-[#1a1a1a] text-white rounded-lg disabled:opacity-40"
          >
            Criar
          </button>
          <button
            onClick={() => setAdding(false)}
            className="px-3 py-2 text-[12px] text-[#aaa] hover:text-[#555]"
          >
            Cancelar
          </button>
        </div>
      )}

      {habits.length === 0 && !adding && (
        <div className="py-16 text-center">
          <p className="text-[13px] text-[#bbb] mb-3">Sem hábitos ainda.</p>
          <button
            onClick={() => setAdding(true)}
            className="text-[13px] text-[#1a1a1a] underline underline-offset-2"
          >
            Criar o primeiro
          </button>
        </div>
      )}

      <div className="space-y-6">
        {habits.map((habit) => {
          const done = isDone(habit.id, today)
          const s = streak(habit.id, logs, today)

          return (
            <div
              key={habit.id}
              className="bg-white border border-[#ebebea] rounded-xl p-4"
              onMouseEnter={() => setHoveredHabit(habit.id)}
              onMouseLeave={() => setHoveredHabit(null)}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                {/* Big checkbox */}
                <button
                  onClick={() => toggleLog(habit.id, today)}
                  className="w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all"
                  style={{
                    borderColor: habit.color,
                    background: done ? habit.color : 'transparent',
                  }}
                >
                  {done && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  )}
                </button>

                <span className={`flex-1 text-[14px] font-medium ${done ? 'line-through text-[#bbb]' : 'text-[#1a1a1a]'}`}>
                  {habit.text}
                </span>

                {/* Streak */}
                {s > 0 && (
                  <span className="text-[12px] font-medium px-2 py-0.5 rounded-full" style={{ color: habit.color, background: `${habit.color}18` }}>
                    🔥 {s}
                  </span>
                )}

                {hoveredHabit === habit.id && (
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="text-[#ccc] hover:text-red-400 transition-colors text-[16px] leading-none ml-1"
                  >×</button>
                )}
              </div>

              {/* 35-day grid */}
              <div className="flex gap-0.5 flex-wrap">
                {days35.map((d) => {
                  const isToday = d === today
                  const checked = isDone(habit.id, d)
                  return (
                    <button
                      key={d}
                      onClick={() => toggleLog(habit.id, d)}
                      title={d}
                      className={`w-[14px] h-[14px] rounded-[3px] transition-all hover:opacity-80 ${
                        isToday ? 'ring-1 ring-offset-1' : ''
                      }`}
                      style={{
                        background: checked ? habit.color : '#f0f0ee',
                        ringColor: isToday ? habit.color : undefined,
                      }}
                    />
                  )
                })}
              </div>

              {/* Days label */}
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-[#ccc]">35 dias</span>
                <span className="text-[10px] text-[#ccc]">hoje</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
