import { useEffect, useState, useRef, useCallback } from 'react'
import { useTasksStore } from './store/tasks'
import { useProjectsStore } from './store/projects'
import ProjectSidebar from './components/ProjectSidebar'
import CaptureBar from './components/CaptureBar'
import TaskList from './components/TaskList'
import KanbanView from './components/KanbanView'
import TableView from './components/TableView'
import GraphView from './components/GraphView'
import DailyNote from './components/DailyNote'
import CalendarView from './components/CalendarView'
import ProjectNote from './components/ProjectNote'
import FreeNotes from './components/FreeNotes'
import ClimbsView from './components/ClimbsView'
import CommandPalette from './components/CommandPalette'

function ViewToggle() {
  const { displayMode, setDisplayMode } = useTasksStore()
  const modes = [
    { key: 'list' as const, icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
        <line x1="1" y1="3" x2="13" y2="3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <line x1="1" y1="11" x2="13" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    )},
    { key: 'kanban' as const, icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
        <rect x="1" y="1" width="3.5" height="12" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="5.25" y="1" width="3.5" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="9.5" y="1" width="3.5" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    )},
    { key: 'table' as const, icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
        <rect x="1" y="1" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <line x1="1" y1="5" x2="13" y2="5" stroke="currentColor" strokeWidth="1"/>
        <line x1="5" y1="5" x2="5" y2="13" stroke="currentColor" strokeWidth="1"/>
      </svg>
    )},
  ]
  return (
    <div className="flex items-center gap-0.5 bg-[#f0f0ee] rounded-lg p-0.5">
      {modes.map(({ key, icon }) => (
        <button
          key={key}
          onClick={() => setDisplayMode(key)}
          className={`p-1.5 rounded-md transition-colors ${
            displayMode === key
              ? 'bg-white text-[#1a1a1a] shadow-sm'
              : 'text-[#aaa] hover:text-[#666]'
          }`}
          title={key}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}

export default function App() {
  const { tasks, loading, activeProject, activeTag, onlyUrgent, view, displayMode, fetchTasks } = useTasksStore()
  const { fetchProjects } = useProjectsStore()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const captureRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => { fetchTasks(); fetchProjects() }, [fetchTasks, fetchProjects])

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

      <main className={`flex-1 flex flex-col ${view === 'focus' && displayMode === 'kanban' ? 'px-6 py-8 overflow-x-auto' : 'px-8 py-10'}`}>
        {view === 'focus' && (
          <div className={displayMode === 'kanban' ? 'w-full' : 'max-w-2xl mx-auto w-full'}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-[22px] font-semibold text-[#1a1a1a]">{title}</h1>
              <ViewToggle />
            </div>

            {displayMode === 'list' && (
              <>
                <div className="mb-8"><CaptureBar /></div>
                {loading ? (
                  <div className="text-[13px] text-[#bbb] text-center py-12">a carregar…</div>
                ) : (
                  <TaskList tasks={visible} />
                )}
                {activeProject && <ProjectNote projectId={activeProject} />}
              </>
            )}

            {displayMode === 'kanban' && (
              <KanbanView tasks={visible} />
            )}

            {displayMode === 'table' && (
              <>
                <div className="mb-6"><CaptureBar /></div>
                <TableView tasks={visible} />
              </>
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

        {view === 'climbs' && (
          <div className="max-w-2xl mx-auto w-full">
            <ClimbsView />
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
