import { useState } from 'react'
import type { Task } from '../types'
import { useTasksStore } from '../store/tasks'
import { useProjectsStore } from '../store/projects'

interface Props {
  tasks: Task[]
  onClose: () => void
}

export default function WeeklyReview({ tasks, onClose }: Props) {
  const { deleteTask, updateTaskField } = useTasksStore()
  const { projects } = useProjectsStore()
  const [dismissed, setDismissed] = useState<Set<number>>(new Set())

  const today = new Date()
  const weekAgo = new Date(today.getTime() - 7 * 86400000).toISOString()
  const fiveDaysAgo = new Date(today.getTime() - 5 * 86400000).toISOString()

  const completedThisWeek = tasks.filter((t) => t.done && t.updated_at >= weekAgo)
  const stale = tasks.filter((t) => !t.done && t.created_at < fiveDaysAgo && !dismissed.has(t.id))
  const noProject = tasks.filter((t) => !t.done && t.projects.length === 0 && !dismissed.has(t.id))

  const snooze = async (id: number) => {
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    await updateTaskField(id, { due_date: nextWeek })
    setDismissed((s) => new Set([...s, id]))
  }

  const remove = async (id: number) => {
    await deleteTask(id)
    setDismissed((s) => new Set([...s, id]))
  }

  const keep = (id: number) => setDismissed((s) => new Set([...s, id]))

  const assignProject = async (id: number, projectId: string) => {
    await updateTaskField(id, {} as any) // touch updated_at
    const { updateProjects } = useTasksStore.getState()
    await updateProjects(id, [projectId])
    setDismissed((s) => new Set([...s, id]))
  }

  const close = () => {
    localStorage.setItem('ob_last_review', new Date().toISOString())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="max-w-xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: '#aaa' }}>Revisão semanal</p>
            <h1 className="text-[26px] font-bold" style={{ color: '#1a1a1a', letterSpacing: '-0.04em' }}>Como foi a semana?</h1>
          </div>
          <button
            onClick={close}
            className="text-[22px] leading-none mt-1 opacity-30 hover:opacity-70 transition-opacity"
            style={{ color: '#1a1a1a' }}
          >×</button>
        </div>

        {/* Secção 1 — Concluídas */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">✅</span>
            <h2 className="text-[14px] font-semibold" style={{ color: '#1a1a1a' }}>
              Completaste {completedThisWeek.length} tarefa{completedThisWeek.length !== 1 ? 's' : ''} esta semana
            </h2>
          </div>
          {completedThisWeek.length > 0 ? (
            <div className="space-y-1 pl-7">
              {completedThisWeek.slice(0, 8).map((t) => (
                <p key={t.id} className="text-[13px] line-through" style={{ color: '#aaa' }}>{t.text}</p>
              ))}
              {completedThisWeek.length > 8 && (
                <p className="text-[12px]" style={{ color: '#ccc' }}>+{completedThisWeek.length - 8} mais</p>
              )}
            </div>
          ) : (
            <p className="text-[13px] pl-7" style={{ color: '#bbb' }}>Nada concluído esta semana.</p>
          )}
        </section>

        {/* Secção 2 — Paradas há +5 dias */}
        {stale.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">⏰</span>
              <h2 className="text-[14px] font-semibold" style={{ color: '#1a1a1a' }}>
                Paradas há mais de 5 dias ({stale.length})
              </h2>
            </div>
            <div className="space-y-2 pl-7">
              {stale.map((t) => (
                <div key={t.id} className="rounded-lg p-3" style={{ background: '#f9f9f7', border: '1px solid #eee' }}>
                  <p className="text-[13px] mb-2" style={{ color: '#1a1a1a' }}>{t.text}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => keep(t.id)}
                      className="text-[11px] px-2.5 py-1 rounded-md font-medium"
                      style={{ background: '#1a1a1a', color: '#fff' }}
                    >Manter</button>
                    <button
                      onClick={() => snooze(t.id)}
                      className="text-[11px] px-2.5 py-1 rounded-md font-medium"
                      style={{ background: '#f0f0ee', color: '#666' }}
                    >Adiar 1 semana</button>
                    <button
                      onClick={() => remove(t.id)}
                      className="text-[11px] px-2.5 py-1 rounded-md font-medium"
                      style={{ background: '#fee2e2', color: '#dc2626' }}
                    >Apagar</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Secção 3 — Sem projeto */}
        {noProject.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">📂</span>
              <h2 className="text-[14px] font-semibold" style={{ color: '#1a1a1a' }}>
                Sem projecto atribuído ({noProject.length})
              </h2>
            </div>
            <div className="space-y-2 pl-7">
              {noProject.map((t) => (
                <div key={t.id} className="rounded-lg p-3 flex items-center gap-3" style={{ background: '#f9f9f7', border: '1px solid #eee' }}>
                  <p className="text-[13px] flex-1" style={{ color: '#1a1a1a' }}>{t.text}</p>
                  <select
                    defaultValue=""
                    onChange={(e) => { if (e.target.value) assignProject(t.id, e.target.value) }}
                    className="text-[12px] rounded-md px-2 py-1 outline-none"
                    style={{ background: '#f0f0ee', color: '#555', border: '1px solid #ddd' }}
                  >
                    <option value="" disabled>Projeto…</option>
                    {projects.filter((p) => !p.parent_id).map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>
        )}

        <button
          onClick={close}
          className="w-full py-3 rounded-xl font-semibold text-[14px] transition-colors"
          style={{ background: '#1a1a1a', color: '#fff' }}
        >
          Fechar revisão
        </button>
      </div>
    </div>
  )
}
