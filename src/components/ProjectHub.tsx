import { useMemo } from 'react'
import { useTasksStore } from '../store/tasks'
import { useTracksStore } from '../store/tracks'
import { useProjectsStore } from '../store/projects'
import { useAuthStore } from '../store/auth'
import CaptureBar from './CaptureBar'
import TaskList from './TaskList'
import ProjectNote from './ProjectNote'
import type { Project } from '../types'

const PIPELINE_COLORS: Record<string, string> = {
  ideia: '#94a3b8', produção: '#3b82f6', mix: '#f59e0b', master: '#8b5cf6', lançado: '#10b981'
}

export default function ProjectHub({ projectId }: { projectId: Project }) {
  const { tasks, loading } = useTasksStore()
  const { tracks } = useTracksStore()
  const { projects } = useProjectsStore()
  const { userId } = useAuthStore()

  const project = projects.find((p) => p.id === projectId)

  const myTasks = tasks.filter((t) =>
    (t.user_id === userId || (!t.user_id && userId === 'hugo')) &&
    t.source !== 'mystic_event' &&
    t.projects.includes(projectId)
  )

  const pending = myTasks.filter((t) => !t.done)
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const doneThisWeek = myTasks.filter((t) => t.done && t.updated_at >= weekAgo)
  const overdue = pending.filter((t) => t.due_date && t.due_date < today)

  const projectTracks = tracks.filter((t) => t.project === projectId && t.status !== 'lançado')

  const statCards = useMemo(() => [
    { label: 'Pendentes', value: pending.length, color: pending.length > 0 ? '#f59e0b' : '#10b981' },
    { label: 'Feitas esta semana', value: doneThisWeek.length, color: '#10b981' },
    { label: 'Em atraso', value: overdue.length, color: overdue.length > 0 ? '#ef4444' : '#94a3b8' },
    { label: 'Músicas ativas', value: projectTracks.length, color: '#8b5cf6' },
  ], [pending.length, doneThisWeek.length, overdue.length, projectTracks.length])

  if (!project) return null

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Project header */}
      <div className="flex items-center gap-3 mb-5">
        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: project.dot_color }} />
        <h1 className="text-[21px] md:text-[24px] font-extrabold" style={{ color: 'var(--text-1)', letterSpacing: '-0.04em' }}>
          {project.label}
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl px-3 py-3"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-[22px] font-extrabold leading-none" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Músicas ativas */}
      {projectTracks.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>
            Músicas
          </p>
          <div className="flex flex-col gap-1.5">
            {projectTracks.map((t) => (
              <div key={t.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <span className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: PIPELINE_COLORS[t.status] ?? '#94a3b8' }} />
                <span className="text-[14px] font-medium flex-1 truncate" style={{ color: 'var(--text-1)' }}>
                  {t.title}
                </span>
                {t.artist && (
                  <span className="text-[12px] shrink-0" style={{ color: 'var(--text-3)' }}>{t.artist}</span>
                )}
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium capitalize"
                  style={{ background: (PIPELINE_COLORS[t.status] ?? '#94a3b8') + '18', color: PIPELINE_COLORS[t.status] ?? '#94a3b8' }}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Capture */}
      <div className="mb-6">
        <CaptureBar defaultProject={projectId} />
      </div>

      {/* Tasks */}
      {loading ? (
        <div className="text-[13px] text-center py-8" style={{ color: 'var(--text-3)' }}>a carregar…</div>
      ) : (
        <TaskList tasks={pending} />
      )}

      {/* Project note */}
      <ProjectNote projectId={projectId} />
    </div>
  )
}
