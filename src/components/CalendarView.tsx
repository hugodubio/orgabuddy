import { useState, useEffect, useRef, useMemo } from 'react'
import { useTasksStore } from '../store/tasks'
import { useProjectsStore } from '../store/projects'
import { useAuthStore } from '../store/auth'
import { useEventsStore } from '../store/events'
import { supabase } from '../lib/supabase'
import type { Task, CalendarEvent, RecurrenceRule } from '../types'

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS_PT = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']

function pad(n: number) { return String(n).padStart(2, '0') }
function toDateStr(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function buildWeeks(year: number, month: number): ({ day: number; date: string } | null)[][] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (firstDay + 6) % 7
  const cells: ({ day: number; date: string } | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, date: toDateStr(year, month, i) })
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: ({ day: number; date: string } | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

function minDate(a: string, b: string) { return a < b ? a : b }
function maxDate(a: string, b: string) { return a > b ? a : b }

// ─── Bar layout algorithm ───────────────────────────────────────────────────

interface BarLayout {
  event: CalendarEvent
  startCol: number
  colSpan: number
  lane: number
  isStart: boolean
  isEnd: boolean
}

function computeBars(
  week: ({ day: number; date: string } | null)[],
  events: CalendarEvent[]
): BarLayout[] {
  const weekDates = week.map(d => d?.date ?? null)
  const defined = weekDates.filter(Boolean) as string[]
  if (!defined.length) return []
  const weekStart = defined[0]
  const weekEnd = defined[defined.length - 1]

  const overlapping = events
    .filter(e => e.start_date <= weekEnd && e.end_date >= weekStart)
    .slice()
    .sort((a, b) => {
      const durA = new Date(a.end_date).getTime() - new Date(a.start_date).getTime()
      const durB = new Date(b.end_date).getTime() - new Date(b.start_date).getTime()
      return durB !== durA ? durB - durA : a.start_date.localeCompare(b.start_date)
    })

  const lanes: { startCol: number; endCol: number }[][] = []
  const bars: BarLayout[] = []

  for (const event of overlapping) {
    let startCol = 0
    let endCol = 6
    for (let i = 0; i < 7; i++) {
      if (weekDates[i] && weekDates[i]! >= event.start_date) { startCol = i; break }
    }
    for (let i = 6; i >= 0; i--) {
      if (weekDates[i] && weekDates[i]! <= event.end_date) { endCol = i; break }
    }

    let lane = 0
    while (true) {
      if (!lanes[lane]) { lanes[lane] = []; break }
      const conflict = lanes[lane].some(b => !(endCol < b.startCol || startCol > b.endCol))
      if (!conflict) break
      lane++
      if (lane > 4) break // max 5 lanes
    }
    if (!lanes[lane]) lanes[lane] = []
    lanes[lane].push({ startCol, endCol })

    bars.push({ event, startCol, colSpan: endCol - startCol + 1, lane, isStart: event.start_date >= weekStart, isEnd: event.end_date <= weekEnd })
  }

  return bars
}

// ─── EventBar ───────────────────────────────────────────────────────────────

function EventBar({ bar, projects, onClick }: { bar: BarLayout; projects: { id: string; label: string; color_bg: string; color_text: string }[]; onClick: () => void }) {
  const proj = projects.find((p: { id: string }) => p.id === bar.event.project_id)
  const left = `calc(${(bar.startCol / 7) * 100}% + 2px)`
  const width = `calc(${(bar.colSpan / 7) * 100}% - 4px)`
  const top = 26 + bar.lane * 22

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="absolute flex items-center px-1.5 text-[10px] font-medium truncate cursor-pointer transition-opacity hover:opacity-80 z-10 pointer-events-auto"
      style={{
        left, width, top,
        height: 18,
        background: proj?.color_bg ?? 'var(--amber)',
        color: proj?.color_text ?? '#fff',
        borderRadius: bar.isStart && bar.isEnd ? 4 : bar.isStart ? '4px 0 0 4px' : bar.isEnd ? '0 4px 4px 0' : 0,
        borderLeft: !bar.isStart ? 'none' : undefined,
        borderRight: !bar.isEnd ? 'none' : undefined,
      }}
    >
      {bar.isStart && bar.event.title}
    </div>
  )
}

// ─── CreateEventForm ─────────────────────────────────────────────────────────

function CreateEventForm({ startDate, endDate, onClose, onSaved }: {
  startDate: string; endDate: string; onClose: () => void; onSaved: () => void
}) {
  const { projects } = useProjectsStore()
  const { createEvent } = useEventsStore()
  const [title, setTitle] = useState('')
  const [start, setStart] = useState(startDate)
  const [end, setEnd] = useState(endDate)
  const [projectId, setProjectId] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [recurrent, setRecurrent] = useState(false)
  const [rule, setRule] = useState<RecurrenceRule>('monthly')
  const [recEnd, setRecEnd] = useState('')
  const [createTask, setCreateTask] = useState(false)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!title.trim() || saving) return
    setSaving(true)
    await createEvent({
      title: title.trim(),
      start_date: start,
      end_date: end < start ? start : end,
      project_id: projectId || null,
      location: location || null,
      notes: notes || null,
      recurrence_rule: recurrent ? rule : null,
      recurrence_end: recurrent && recEnd ? recEnd : null,
      create_task: createTask,
    })
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="rounded-xl p-4 flex flex-col gap-3 mt-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p className="text-[11px] font-semibold" style={{ color: 'var(--text-3)' }}>Novo evento</p>

      <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onClose() }}
        placeholder="Título"
        className="px-3 py-2 rounded-lg text-[13px] outline-none"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />

      <div className="flex gap-2">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-[10px]" style={{ color: 'var(--text-3)' }}>Início</label>
          <input type="date" value={start} onChange={e => setStart(e.target.value)}
            className="px-3 py-2 rounded-lg text-[13px] outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-[10px]" style={{ color: 'var(--text-3)' }}>Fim</label>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)}
            className="px-3 py-2 rounded-lg text-[13px] outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
        </div>
      </div>

      <div className="flex gap-2">
        <select value={projectId} onChange={e => setProjectId(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
          <option value="">Sem projeto</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <input value={location} onChange={e => setLocation(e.target.value)}
          placeholder="Local (opcional)"
          className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
      </div>

      <input value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="Notas (opcional)"
        className="px-3 py-2 rounded-lg text-[13px] outline-none"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />

      {/* Recorrente */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={recurrent} onChange={e => setRecurrent(e.target.checked)} className="accent-[var(--amber)]" />
        <span className="text-[12px]" style={{ color: 'var(--text-2)' }}>Recorrente</span>
      </label>
      {recurrent && (
        <div className="flex gap-2">
          <select value={rule} onChange={e => setRule(e.target.value as RecurrenceRule)}
            className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
            <option value="first-week-monthly">Primeira semana de cada mês</option>
          </select>
          <input type="date" value={recEnd} onChange={e => setRecEnd(e.target.value)}
            placeholder="Até quando"
            className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
        </div>
      )}

      {/* Criar tarefa */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={createTask} onChange={e => setCreateTask(e.target.checked)} className="accent-[var(--amber)]" />
        <span className="text-[12px]" style={{ color: 'var(--text-2)' }}>Criar tarefa associada</span>
      </label>

      <div className="flex gap-2">
        <button onClick={submit} disabled={!title.trim() || saving}
          className="px-4 py-2 rounded-lg text-[13px] font-semibold disabled:opacity-40"
          style={{ background: 'var(--amber)', color: '#fff' }}>
          {saving ? '…' : 'Guardar'}
        </button>
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px]"
          style={{ background: 'var(--border)', color: 'var(--text-2)' }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── EditEventForm (ob_tasks — legado) ──────────────────────────────────────

function parseEventTime(task: Task) {
  return task.reason?.match(/(\d{2}:\d{2})/)?.[1] ?? null
}

function sourceDot(source: Task['source']) {
  if (source === 'mystic_event') return '#a78bfa'
  if (source === 'mystic_task') return '#818cf8'
  return 'var(--text-1)'
}

function EditEventForm({ task, onClose, onSaved, onDelete }: {
  task: Task; onClose: () => void; onSaved: () => void; onDelete: () => void
}) {
  const [title, setTitle] = useState(task.text.replace(/^🎵\s*/, ''))
  const [time, setTime] = useState(parseEventTime(task) ?? '')
  const [proj, setProj] = useState(task.projects[0] ?? '')
  const [saving, setSaving] = useState(false)
  const { projects } = useProjectsStore()

  const submit = async () => {
    const text = title.trim()
    if (!text || saving) return
    setSaving(true)
    const date = task.due_date ?? ''
    const reason = time ? `${date} às ${time}` : date
    await supabase.from('ob_tasks').update({ text, reason, projects: proj ? [proj] : [] }).eq('id', task.id)
    setSaving(false)
    onSaved(); onClose()
  }

  return (
    <div className="mt-2 p-3 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <p className="text-[11px] mb-2" style={{ color: 'var(--text-3)' }}>Editar evento</p>
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onClose() }}
        className="w-full rounded px-2 py-1.5 text-[13px] outline-none mb-2"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
      <input type="time" value={time} onChange={e => setTime(e.target.value)}
        className="w-full rounded px-2 py-1.5 text-[13px] outline-none mb-2"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
      <select value={proj} onChange={e => setProj(e.target.value)}
        className="w-full rounded px-2 py-1.5 text-[13px] outline-none mb-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
        <option value="">Sem projeto</option>
        {useProjectsStore.getState().projects.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
      <div className="flex items-center gap-2">
        <button onClick={submit} disabled={!title.trim() || saving}
          className="px-3 py-1 text-[12px] text-white rounded disabled:opacity-40"
          style={{ background: 'var(--amber)' }}>
          {saving ? '…' : 'Guardar'}
        </button>
        <button onClick={onClose} className="px-2 py-1 text-[12px]" style={{ color: 'var(--text-3)' }}>Cancelar</button>
        <button onClick={async () => { await supabase.from('ob_tasks').delete().eq('id', task.id); onDelete(); onClose() }}
          className="ml-auto px-2 py-1 text-[12px]" style={{ color: '#c8402e' }}>Apagar</button>
      </div>
    </div>
  )
}

// ─── DayPanel ────────────────────────────────────────────────────────────────

function DayPanel({ dateStr, year, month, calEvents, taskEvents, onClose, onRefresh }: {
  dateStr: string; year: number; month: number
  calEvents: CalendarEvent[]; taskEvents: Task[]
  onClose: () => void; onRefresh: () => void
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null)
  const { deleteEvent } = useEventsStore()
  const { projects } = useProjectsStore()
  const day = parseInt(dateStr.split('-')[2])

  return (
    <div className="rounded-t-2xl md:rounded-xl md:mt-4 p-4 max-h-[70vh] overflow-y-auto"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[14px] font-semibold" style={{ color: 'var(--text-1)' }}>
          {day} de {MONTHS_PT[month]}
        </p>
        <div className="flex gap-2">
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-[12px] rounded-lg font-medium"
            style={{ background: 'var(--amber)', color: '#fff' }}>
            + Evento
          </button>
          <button onClick={onClose} className="p-1 text-[12px]" style={{ color: 'var(--text-3)' }}>✕</button>
        </div>
      </div>

      {/* ob_events for this day */}
      {calEvents.map(e => {
        const proj = projects.find(p => p.id === e.project_id)
        return (
          <div key={e.id} className="flex items-start gap-2 py-2 border-b group"
            style={{ borderColor: 'var(--border)' }}>
            {proj && (
              <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                style={{ background: proj.color_bg, color: proj.color_text }}>{proj.label}</span>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px]" style={{ color: 'var(--text-1)' }}>{e.title}</p>
              <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                {e.start_date} → {e.end_date}
                {e.location ? ` · ${e.location}` : ''}
                {e.recurrence_rule ? ' · ↻' : ''}
              </p>
            </div>
            <button
              onClick={() => setDeletingEventId(deletingEventId === e.id ? null : e.id)}
              className="opacity-0 group-hover:opacity-40 hover:!opacity-80 text-[11px]"
              style={{ color: 'var(--text-2)' }}>✕</button>
            {deletingEventId === e.id && (
              <div className="absolute mt-6 right-4 flex gap-2 p-2 rounded-lg shadow-md z-20"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <span className="text-[12px]" style={{ color: 'var(--text-2)' }}>Apagar?</span>
                <button onClick={async () => { await deleteEvent(e.id); setDeletingEventId(null); onRefresh() }}
                  className="text-[12px] font-semibold" style={{ color: '#c8402e' }}>Sim</button>
                <button onClick={() => setDeletingEventId(null)} className="text-[12px]" style={{ color: 'var(--text-3)' }}>Não</button>
              </div>
            )}
          </div>
        )
      })}

      {/* ob_tasks for this day */}
      {taskEvents.map(t => (
        <div key={t.id}>
          <div className="flex items-start gap-2 py-2 border-b group cursor-pointer"
            style={{ borderColor: 'var(--border)' }}
            onClick={() => t.source === 'calendar' && setEditingTaskId(editingTaskId === t.id ? null : t.id)}>
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: sourceDot(t.source) }} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px]" style={{ color: 'var(--text-1)' }}>{t.text.replace(/^🎵\s*/, '')}</p>
              {parseEventTime(t) && <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>{parseEventTime(t)}</p>}
            </div>
          </div>
          {editingTaskId === t.id && (
            <EditEventForm task={t} onClose={() => setEditingTaskId(null)} onSaved={onRefresh} onDelete={onRefresh} />
          )}
        </div>
      ))}

      {calEvents.length === 0 && taskEvents.length === 0 && !showCreate && (
        <p className="text-[13px] py-2" style={{ color: 'var(--text-3)' }}>Nenhum evento. Clica em + Evento.</p>
      )}

      {showCreate && (
        <CreateEventForm
          startDate={dateStr}
          endDate={dateStr}
          onClose={() => setShowCreate(false)}
          onSaved={() => { onRefresh(); setShowCreate(false) }}
        />
      )}
    </div>
  )
}

// ─── CalendarView ────────────────────────────────────────────────────────────

export default function CalendarView() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState<string | null>(null)
  const [dragEnd, setDragEnd] = useState<string | null>(null)
  const [showRangeForm, setShowRangeForm] = useState(false)
  const isDragging = useRef(false)
  const dragStartRef = useRef<string | null>(null)
  const dragEndRef = useRef<string | null>(null)

  const { tasks, fetchTasks } = useTasksStore()
  const { projects } = useProjectsStore()
  const { events, fetchEvents } = useEventsStore()

  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`

  const weeks = useMemo(() => buildWeeks(year, month), [year, month])

  const monthStart = `${year}-${pad(month + 1)}-01`
  const monthEnd = `${year}-${pad(month + 1)}-${new Date(year, month + 1, 0).getDate()}`

  useEffect(() => {
    fetchTasks()
    fetchEvents(monthStart, monthEnd)
  }, [year, month])

  useEffect(() => {
    const onUp = () => {
      if (isDragging.current && dragStart && dragEnd && dragStart !== dragEnd) {
        setShowRangeForm(true)
      }
      isDragging.current = false
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return
      e.preventDefault()
      const touch = e.touches[0]
      const el = document.elementFromPoint(touch.clientX, touch.clientY)
      const date = (el?.closest('[data-date]') as HTMLElement)?.dataset?.date
      if (date) { setDragEnd(date); dragEndRef.current = date }
    }
    const onTouchEnd = () => {
      const start = dragStartRef.current
      const end = dragEndRef.current
      if (isDragging.current && start && end && start !== end) {
        setShowRangeForm(true)
      } else if (isDragging.current && start) {
        setSelectedDate(prev => prev === start ? null : start)
        setDragStart(null); setDragEnd(null)
        dragStartRef.current = null; dragEndRef.current = null
      }
      isDragging.current = false
    }
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)
    return () => {
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [dragStart, dragEnd])

  const calendarTasks = tasks.filter(t =>
    ['calendar', 'mystic_event', 'mystic_task'].includes(t.source) && t.due_date
  )

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {}
    for (const t of calendarTasks) {
      const d = t.due_date!
      if (!map[d]) map[d] = []
      map[d].push(t)
    }
    return map
  }, [calendarTasks])

  const dragMin = dragStart && dragEnd ? minDate(dragStart, dragEnd) : null
  const dragMax = dragStart && dragEnd ? maxDate(dragStart, dragEnd) : null

  const isInDrag = (date: string) => !!dragMin && !!dragMax && date >= dragMin && date <= dragMax

  const prevMonth = () => {
    setSelectedDate(null)
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    setSelectedDate(null)
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const handleDayMouseDown = (date: string) => {
    isDragging.current = true
    setDragStart(date); setDragEnd(date)
    dragStartRef.current = date; dragEndRef.current = date
    setShowRangeForm(false); setSelectedDate(null)
  }

  const handleDayMouseEnter = (date: string) => {
    if (isDragging.current) setDragEnd(date)
  }

  const handleDayClick = (date: string) => {
    if (dragStart !== dragEnd) return
    setSelectedDate(selectedDate === date ? null : date)
    setDragStart(null); setDragEnd(null)
  }

  const handleDayTouchStart = (date: string, e: React.TouchEvent) => {
    e.preventDefault()
    isDragging.current = true
    setDragStart(date); setDragEnd(date)
    dragStartRef.current = date; dragEndRef.current = date
    setShowRangeForm(false); setSelectedDate(null)
  }

  const selectedDayEvents = selectedDate ? (events.filter(e => e.start_date <= selectedDate && e.end_date >= selectedDate)) : []
  const selectedTaskEvents = selectedDate ? (tasksByDate[selectedDate] ?? []) : []

  return (
    <div className="max-w-3xl mx-auto w-full select-none">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-[22px] font-semibold flex-1" style={{ color: 'var(--text-1)' }}>
          {MONTHS_PT[month]} {year}
        </h1>
        <button onClick={prevMonth} className="p-1.5 rounded transition-colors hover:bg-[#f0f0ee]" style={{ color: 'var(--text-3)' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button onClick={nextMonth} className="p-1.5 rounded transition-colors hover:bg-[#f0f0ee]" style={{ color: 'var(--text-3)' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_PT.map(d => (
          <div key={d} className="text-center text-[11px] uppercase tracking-widest pb-2" style={{ color: 'var(--text-3)' }}>{d}</div>
        ))}
      </div>

      {/* Week rows */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {weeks.map((week, wi) => {
          const bars = computeBars(week, events)
          const maxLane = bars.length ? Math.max(...bars.map(b => b.lane)) : -1
          const barsHeight = maxLane >= 0 ? (maxLane + 1) * 22 + 4 : 0
          const rowHeight = Math.max(72, 28 + barsHeight)

          return (
            <div key={wi} className="relative grid grid-cols-7"
              style={{ borderBottom: wi < weeks.length - 1 ? '1px solid var(--border)' : 'none', height: rowHeight }}>

              {/* Day cells */}
              {week.map((d, di) => {
                const isToday = d?.date === todayStr
                const isSelected = d?.date === selectedDate
                const inDrag = d?.date ? isInDrag(d.date) : false

                return (
                  <div key={di}
                    data-date={d?.date}
                    className="h-full cursor-pointer transition-colors"
                    style={{
                      borderRight: di < 6 ? '1px solid var(--border)' : 'none',
                      background: isSelected ? '#fef3e2' : inDrag ? '#fff7ed' : d ? 'var(--surface)' : '#f9f8f6',
                    }}
                    onMouseDown={() => d && handleDayMouseDown(d.date)}
                    onMouseEnter={() => d && handleDayMouseEnter(d.date)}
                    onMouseUp={() => d && handleDayClick(d.date)}
                    onTouchStart={d ? (e) => handleDayTouchStart(d.date, e) : undefined}
                  >
                    {d && (
                      <span className={`text-[12px] font-medium inline-flex w-5 h-5 items-center justify-center rounded-full mt-1.5 ml-1.5`}
                        style={{
                          background: isToday ? 'var(--text-1)' : 'transparent',
                          color: isToday ? '#fff' : 'var(--text-2)',
                        }}>
                        {d.day}
                      </span>
                    )}

                    {/* Task dots (small, below day number) */}
                    {d && (tasksByDate[d.date] ?? []).length > 0 && (
                      <div className="flex gap-0.5 flex-wrap px-1 mt-1" style={{ marginTop: barsHeight + 8 }}>
                        {(tasksByDate[d.date] ?? []).slice(0, 2).map(t => (
                          <span key={t.id} className="w-1 h-1 rounded-full"
                            style={{ background: sourceDot(t.source) }} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Event bars overlay */}
              {bars.map(bar => (
                <EventBar key={bar.event.id} bar={bar} projects={projects}
                  onClick={() => setSelectedDate(bar.event.start_date)} />
              ))}
            </div>
          )
        })}
      </div>

      {/* Drag range form */}
      {showRangeForm && dragMin && dragMax && (
        <CreateEventForm
          startDate={dragMin}
          endDate={dragMax}
          onClose={() => { setShowRangeForm(false); setDragStart(null); setDragEnd(null) }}
          onSaved={() => {
            setShowRangeForm(false); setDragStart(null); setDragEnd(null)
            fetchEvents(monthStart, monthEnd)
          }}
        />
      )}

      {/* Day panel — bottom sheet no mobile, inline no desktop */}
      {selectedDate && !showRangeForm && (
        <>
          {/* Backdrop mobile */}
          <div className="fixed inset-0 z-40 md:hidden bg-black/20"
            onClick={() => setSelectedDate(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 md:relative md:bottom-auto md:z-auto md:mt-4">
            <DayPanel
              dateStr={selectedDate}
              year={year}
              month={month}
              calEvents={selectedDayEvents}
              taskEvents={selectedTaskEvents}
              onClose={() => setSelectedDate(null)}
              onRefresh={() => { fetchTasks(); fetchEvents(monthStart, monthEnd) }}
            />
          </div>
        </>
      )}
    </div>
  )
}
