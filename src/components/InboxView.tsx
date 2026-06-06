import { useState } from 'react'
import { useTasksStore } from '../store/tasks'
import { useProjectsStore } from '../store/projects'
import { useAuthStore } from '../store/auth'

export default function InboxView() {
  const { tasks, deleteTask, updateProjects, updateTaskField } = useTasksStore()
  const { projects } = useProjectsStore()
  const { userId } = useAuthStore()
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const inbox = tasks
    .filter((t) =>
      !t.done &&
      t.projects.length === 0 &&
      t.source !== 'mystic_event' &&
      (t.user_id === userId || (!t.user_id && userId === 'hugo'))
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const priorityColor = (p: string) =>
    p === 'alta' ? '#ef4444' : p === 'média' ? '#f59e0b' : '#94a3b8'
  const priorityLabel = (p: string) =>
    p === 'alta' ? 'Urgente' : p === 'média' ? 'Normal' : 'Depois'

  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    const days = Math.floor((Date.now() - d.getTime()) / 86400000)
    if (days === 0) return 'hoje'
    if (days === 1) return 'ontem'
    return `há ${days} dias`
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <h1 className="text-[21px] md:text-[24px] font-extrabold" style={{ color: 'var(--text-1)', letterSpacing: '-0.04em' }}>
          Inbox
        </h1>
        {inbox.length > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[12px] font-bold"
            style={{ background: '#ef444418', color: '#ef4444' }}>
            {inbox.length}
          </span>
        )}
      </div>

      {/* Empty */}
      {inbox.length === 0 && (
        <div className="text-center py-20">
          <p className="text-[40px] mb-3">✓</p>
          <p className="text-[16px] font-semibold" style={{ color: 'var(--text-2)' }}>Inbox limpo</p>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-3)' }}>
            Todas as tarefas estão organizadas
          </p>
        </div>
      )}

      {inbox.length > 0 && (
        <p className="text-[13px] mb-4" style={{ color: 'var(--text-3)' }}>
          Atribui um projeto a cada tarefa ou descarta as que já não fazem sentido.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {inbox.map((task) => (
          <div key={task.id}
            className="rounded-xl px-4 py-3"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

            <div className="flex items-start gap-2 mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-2"
                style={{ background: priorityColor(task.priority) }} />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium leading-snug" style={{ color: 'var(--text-1)' }}>
                  {task.text}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                  {priorityLabel(task.priority)} · capturada {fmtDate(task.created_at)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Project assign */}
              <select
                defaultValue=""
                onChange={async (e) => {
                  if (!e.target.value) return
                  await updateProjects(task.id, [e.target.value])
                }}
                className="flex-1 min-w-[120px] px-2.5 py-2 rounded-lg text-[12px] outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
              >
                <option value="">Atribuir projeto…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>

              {/* Priority bump */}
              {task.priority !== 'alta' && (
                <button
                  onClick={() => updateTaskField(task.id, { priority: 'alta' })}
                  className="px-2.5 py-2 rounded-lg text-[12px] font-medium transition-colors"
                  style={{ background: '#fef2f2', color: '#ef4444' }}>
                  ↑ Urgente
                </button>
              )}

              {/* Delete */}
              {confirmDelete === task.id ? (
                <>
                  <button onClick={() => deleteTask(task.id)}
                    className="px-2.5 py-2 rounded-lg text-[12px] font-semibold"
                    style={{ background: '#ef4444', color: '#fff' }}>
                    Confirmar
                  </button>
                  <button onClick={() => setConfirmDelete(null)}
                    className="px-2.5 py-2 rounded-lg text-[12px]"
                    style={{ color: 'var(--text-3)' }}>
                    Cancelar
                  </button>
                </>
              ) : (
                <button onClick={() => setConfirmDelete(task.id)}
                  className="px-2.5 py-2 rounded-lg text-[12px] transition-colors"
                  style={{ color: 'var(--text-3)' }}>
                  Ignorar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
