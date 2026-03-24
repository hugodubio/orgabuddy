import { useEffect, useState, useRef, useCallback } from 'react'
import { useTasksStore } from './store/tasks'
import { useProjectsStore } from './store/projects'
import ProjectSidebar from './components/ProjectSidebar'
import CaptureBar from './components/CaptureBar'
import TaskList from './components/TaskList'
import GraphView from './components/GraphView'
import DailyNote from './components/DailyNote'
import CommandPalette from './components/CommandPalette'

export default function App() {
  const { tasks, loading, activeProject, onlyUrgent, view, fetchTasks } = useTasksStore()
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

  const visible = tasks.filter((t) => {
    if (onlyUrgent) return t.priority === 'alta' && !t.done
    if (activeProject) return t.projects.includes(activeProject)
    return true
  })

  const title = onlyUrgent
    ? 'Urgentes'
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
