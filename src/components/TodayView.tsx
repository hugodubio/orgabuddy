import { useTasksStore } from '../store/tasks'
import { useProjectsStore } from '../store/projects'
import { useAuthStore } from '../store/auth'

const PT_MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
const PT_DAYS = ['domingo','segunda','terça','quarta','quinta','sexta','sábado']

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function todayLabel() {
  const d = new Date()
  return `${PT_DAYS[d.getDay()]}, ${d.getDate()} de ${PT_MONTHS[d.getMonth()]}`
}

function PriorityDot({ priority }: { priority: string }) {
  const color = priority === 'alta' ? '#ef4444' : priority === 'média' ? '#f59e0b' : '#94a3b8'
  return <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: color }} />
}

export default function TodayView() {
  const { tasks, toggleDone, scheduleToday, unscheduleToday } = useTasksStore()
  const { projects } = useProjectsStore()
  const { userId } = useAuthStore()
  const today = todayStr()

  const myTasks = tasks.filter((t) =>
    (t.user_id === userId || (!t.user_id && userId === 'hugo')) &&
    t.source !== 'mystic_event'
  )

  const scheduled = myTasks.filter((t) =>
    !t.done && (t.scheduled_date === today || t.due_date === today)
  )
  // deduplicate
  const scheduledIds = new Set(scheduled.map((t) => t.id))

  const doneToday = myTasks.filter((t) =>
    t.done && t.updated_at.startsWith(today)
  )

  const suggestions = myTasks.filter((t) =>
    !t.done &&
    !scheduledIds.has(t.id) &&
    t.priority === 'alta' &&
    !t.scheduled_date
  ).slice(0, 5)

  const total = scheduled.length + (doneToday.length > 0 ? doneToday.length : 0)
  const pct = total > 0 ? Math.round((doneToday.length / total) * 100) : 0

  const getProject = (id: string) => projects.find((p) => p.id === id)

  const TaskRow = ({ task, showRemove }: { task: typeof myTasks[0]; showRemove?: boolean }) => (
    <div className="flex items-start gap-3 px-3 py-3 rounded-xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <button
        onClick={() => toggleDone(task.id)}
        className="mt-0.5 w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-colors"
        style={{ border: task.done ? 'none' : '1.5px solid var(--border)', background: task.done ? 'var(--brand-secondary)' : 'transparent' }}
      >
        {task.done && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
            <path d="M2 6l2.5 2.5L10 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] leading-snug ${task.done ? 'line-through' : ''}`}
          style={{ color: task.done ? 'var(--text-3)' : 'var(--text-1)' }}>
          {task.text}
        </p>
        {task.projects.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {task.projects.map((pid) => {
              const p = getProject(pid)
              return p ? (
                <span key={pid} className="text-[10px] px-1.5 py-0.5 rounded-[3px] font-medium"
                  style={{ background: p.color_bg, color: p.color_text }}>
                  {p.label}
                </span>
              ) : null
            })}
          </div>
        )}
      </div>
      <PriorityDot priority={task.priority} />
      {showRemove && (
        <button onClick={() => unscheduleToday(task.id)}
          className="text-[16px] leading-none shrink-0 mt-0.5"
          style={{ color: 'var(--text-3)' }}
          title="Remover de hoje">×</button>
      )}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[21px] md:text-[24px] font-extrabold capitalize"
          style={{ color: 'var(--text-1)', letterSpacing: '-0.04em' }}>
          {todayLabel()}
        </h1>

        {/* Progress bar */}
        {total > 0 && (
          <div className="flex items-center gap-3 mt-3">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: 'var(--brand-secondary)' }} />
            </div>
            <span className="text-[12px] font-medium shrink-0" style={{ color: 'var(--text-3)' }}>
              {doneToday.length}/{total}
            </span>
          </div>
        )}
      </div>

      {/* Empty state */}
      {scheduled.length === 0 && suggestions.length === 0 && (
        <div className="text-center py-20">
          <p className="text-[40px] mb-3">🎉</p>
          <p className="text-[16px] font-semibold" style={{ color: 'var(--text-2)' }}>Dia limpo</p>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-3)' }}>Nada agendado para hoje</p>
        </div>
      )}

      {/* Tarefas de hoje */}
      {scheduled.length > 0 && (
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>
            A fazer hoje
          </p>
          <div className="flex flex-col gap-2">
            {scheduled.map((t) => (
              <TaskRow key={t.id} task={t} showRemove={t.scheduled_date === today && t.due_date !== today} />
            ))}
          </div>
        </div>
      )}

      {/* Sugestões */}
      {suggestions.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>
            Urgentes — adicionar ao dia?
          </p>
          <div className="flex flex-col gap-2">
            {suggestions.map((t) => (
              <div key={t.id}
                className="flex items-start gap-3 px-3 py-3 rounded-xl"
                style={{ background: 'var(--bg)', border: '1px dashed var(--border)' }}>
                <PriorityDot priority={t.priority} />
                <p className="flex-1 text-[14px] leading-snug" style={{ color: 'var(--text-2)' }}>{t.text}</p>
                <button
                  onClick={() => scheduleToday(t.id)}
                  className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shrink-0 transition-colors"
                  style={{ background: 'var(--brand-secondary)', color: '#fff' }}>
                  + Hoje
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feitas hoje */}
      {doneToday.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>
            Feitas hoje ({doneToday.length})
          </p>
          <div className="flex flex-col gap-2">
            {doneToday.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
