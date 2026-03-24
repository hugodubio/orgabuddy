import { useState } from 'react'
import { useTasksStore } from '../store/tasks'
import { supabase } from '../lib/supabase'
import type { Task } from '../types'

const MONTHS_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]
const DAYS_PT = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']

function parseEventDate(task: Task): string | null {
  const match = task.reason?.match(/\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : null
}

function parseEventTime(task: Task): string | null {
  const match = task.reason?.match(/(\d{2}:\d{2})/)
  return match ? match[1] : null
}

function buildGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (firstDay + 6) % 7 // Monday = 0
  const days: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)
  while (days.length % 7 !== 0) days.push(null)
  return days
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function sourceDot(source: Task['source']) {
  if (source === 'mystic_event') return 'bg-purple-400'
  if (source === 'mystic_task') return 'bg-indigo-400'
  return 'bg-[#1a1a1a]'
}

interface AddEventFormProps {
  date: string
  onClose: () => void
  onSaved: () => void
}

function AddEventForm({ date, onClose, onSaved }: AddEventFormProps) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    const text = title.trim()
    if (!text || saving) return
    setSaving(true)
    setError(null)
    const reason = time ? `${date} às ${time}` : date
    const { error: err } = await supabase.from('ob_tasks').insert({
      text,
      projects: [],
      priority: 'média',
      reason,
      type: 'tarefa',
      source: 'calendar',
      done: false,
      links: [],
    })
    setSaving(false)
    if (err) { setError('Erro ao guardar evento'); return }
    onSaved()
    onClose()
  }

  return (
    <div className="mt-3 border-t border-[#ebebea] pt-3">
      <p className="text-[11px] text-[#aaa] mb-2">Novo evento</p>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') onClose()
        }}
        placeholder="Título do evento"
        className="w-full bg-[#f7f7f5] border border-[#d0d0ce] rounded px-2 py-1.5 text-[13px] outline-none placeholder:text-[#ccc] mb-2"
      />
      <input
        value={time}
        onChange={(e) => setTime(e.target.value)}
        placeholder="Hora (ex: 20:00)"
        className="w-full bg-[#f7f7f5] border border-[#d0d0ce] rounded px-2 py-1.5 text-[13px] outline-none placeholder:text-[#ccc] mb-2"
      />
      {error && <p className="text-[11px] text-red-400 mb-1">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={!title.trim() || saving}
          className="px-3 py-1 text-[12px] bg-[#1a1a1a] text-white rounded disabled:opacity-40"
        >
          {saving ? '…' : 'Guardar'}
        </button>
        <button onClick={onClose} className="px-2 py-1 text-[12px] text-[#aaa] hover:text-[#555]">
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default function CalendarView() {
  const { tasks, fetchTasks } = useTasksStore()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [addingEvent, setAddingEvent] = useState(false)

  const calendarTasks = tasks.filter(
    (t) => t.source === 'calendar' || t.source === 'mystic_event' || t.source === 'mystic_task'
  )

  const eventsByDate = calendarTasks.reduce<Record<string, Task[]>>((acc, t) => {
    const date = parseEventDate(t)
    if (date) {
      if (!acc[date]) acc[date] = []
      acc[date].push(t)
    }
    return acc
  }, {})

  const grid = buildGrid(year, month)

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const selectedDateStr = selectedDay
    ? `${year}-${pad(month + 1)}-${pad(selectedDay)}`
    : null

  const selectedEvents = selectedDateStr ? (eventsByDate[selectedDateStr] ?? []) : []

  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-[22px] font-semibold text-[#1a1a1a] flex-1">
          {MONTHS_PT[month]} {year}
        </h1>
        <button onClick={prevMonth} className="p-1.5 rounded hover:bg-[#f0f0ee] text-[#666]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button onClick={nextMonth} className="p-1.5 rounded hover:bg-[#f0f0ee] text-[#666]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_PT.map((d) => (
          <div key={d} className="text-center text-[11px] uppercase tracking-widest text-[#aaa] pb-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-[#ebebea] rounded-lg overflow-hidden border border-[#ebebea]">
        {grid.map((day, i) => {
          const dateStr = day ? `${year}-${pad(month + 1)}-${pad(day)}` : null
          const dayEvents = dateStr ? (eventsByDate[dateStr] ?? []) : []
          const isSelected = day === selectedDay

          return (
            <div
              key={i}
              onClick={() => {
                if (!day) return
                setSelectedDay(day === selectedDay ? null : day)
                setAddingEvent(false)
              }}
              className={`min-h-[72px] p-1.5 bg-white cursor-pointer transition-colors ${
                day ? 'hover:bg-[#fafafa]' : 'bg-[#f7f7f5] cursor-default'
              } ${isSelected ? 'ring-2 ring-inset ring-[#1a1a1a]' : ''}`}
            >
              {day && (
                <>
                  <span
                    className={`text-[12px] font-medium inline-flex w-5 h-5 items-center justify-center rounded-full ${
                      isToday(day)
                        ? 'bg-[#1a1a1a] text-white'
                        : 'text-[#555]'
                    }`}
                  >
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-1 truncate"
                        title={t.text}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sourceDot(t.source)}`} />
                        <span className="text-[10px] text-[#555] truncate">{t.text.replace(/^🎵\s*/, '')}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-[#aaa]">+{dayEvents.length - 3}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Day panel */}
      {selectedDay && selectedDateStr && (
        <div className="mt-4 bg-white border border-[#ebebea] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[14px] font-semibold text-[#1a1a1a]">
              {selectedDay} de {MONTHS_PT[month]}
            </p>
            <button
              onClick={() => setAddingEvent(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-[12px] bg-[#1a1a1a] text-white rounded hover:bg-[#333] transition-colors"
            >
              <span className="text-[14px] leading-none">+</span>
              Evento
            </button>
          </div>

          {selectedEvents.length === 0 && !addingEvent && (
            <p className="text-[13px] text-[#bbb]">Nenhum evento. Clica em + Evento para adicionar.</p>
          )}

          {selectedEvents.map((t) => (
            <div key={t.id} className="flex items-start gap-2 py-2 border-b border-[#f5f5f3] last:border-0">
              <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${sourceDot(t.source)}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-[#1a1a1a]">{t.text.replace(/^🎵\s*/, '')}</p>
                {parseEventTime(t) && (
                  <p className="text-[11px] text-[#aaa]">{parseEventTime(t)}</p>
                )}
                {t.source === 'mystic_event' && (
                  <span className="text-[10px] text-purple-400">Mystic Fyah</span>
                )}
              </div>
            </div>
          ))}

          {addingEvent && (
            <AddEventForm
              date={selectedDateStr}
              onClose={() => setAddingEvent(false)}
              onSaved={fetchTasks}
            />
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#1a1a1a]" />
          <span className="text-[11px] text-[#aaa]">Manual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          <span className="text-[11px] text-[#aaa]">Mystic evento</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-[11px] text-[#aaa]">Mystic tarefa</span>
        </div>
      </div>
    </div>
  )
}
