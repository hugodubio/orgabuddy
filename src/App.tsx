import { useEffect, useState, useRef, useCallback } from 'react'
import { useTasksStore } from './store/tasks'
import { useProjectsStore } from './store/projects'
import ProjectSidebar from './components/ProjectSidebar'
import CaptureBar from './components/CaptureBar'
import TaskList from './components/TaskList'
import GraphView from './components/GraphView'
import DailyNote from './components/DailyNote'
import CalendarView from './components/CalendarView'
import ProjectNote from './components/ProjectNote'
import FreeNotes from './components/FreeNotes'
import CommandPalette from './components/CommandPalette'

export default function App() {
  const { tasks, loading, activeProject, activeTag, onlyUrgent, view, fetchTasks } = useTasksStore()
  const { fetchProjects } = useProjectsStore()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const captureRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => { fetchTasks(); fetchProjects() }, [fetchTasks, fetchProjects])

  // Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const focusCapture = useCallback(() => {
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>('input[placeholder*="cabeça"]')
      el?.focus()
    }, 50)
  }, [])

  const MYSTIC_SOURCES = ['mystic_event', 'mystic_task']

  const visible = tasks.filter((t) => {
    if (MYSTIC_SOURCES.includes(t.source)) return false
    if (onlyUrgent) return t.priority === 'alta' && !t.done
    if (activeTag) return (t.tags ?? []).includes(activeTag)
    if (activeProject) return t.projects.includes(activeProject)
    return true
  })

  const title = onlyUrgent
    ? 'Urgentes'
    : activeTag
    ? `#${activeTag}`
    : activeProject
    ? activeProject.charAt(0).toUpperCase() + activeProject.slice(1)
    : 'Foco do dia'

  return (
    <div className="flex min-h-screen">
      <ProjectSidebar />

      <main className="flex-1 px-8 py-10 flex flex-col">
        {view === 'focus' && (
          <div className="max-w-2xl mx-auto w-full">
            <h1 className="text-[22px] font-semibold text-[#1a1a1a] mb-6">{title}</h1>
            <div className="mb-8">
              <CaptureBar />
            </div>
            {loading ? (
              <div className="text-[13px] text-[#bbb] text-center py-12">a carregar…</div>
            ) : (
              <TaskList tasks={visible} />
            )}
            {activeProject && <ProjectNote projectId={activeProject} />}
          </div>
        )}

        {view === 'graph' && (
          <div className="flex-1 flex flex-col">
            <GraphView />
          </div>
        )}

        {view === 'note' && (
          <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
            <DailyNote />
          </div>
        )}

        {view === 'calendar' && (
          <div className="flex-1 flex flex-col">
            <CalendarView />
          </div>
        )}

        {view === 'notes' && (
          <div className="flex-1 flex min-h-0 -mx-8 -my-10">
            <FreeNotes />
          </div>
        )}
      </main>

      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          onFocusCapture={focusCapture}
        />
      )}
    </div>
  )
}
