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
import CommandPalette from './components/CommandPalette'
import SearchView from './components/SearchView'

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

// Bottom nav for mobile
function BottomNav({ onMenuOpen }: { onMenuOpen: () => void }) {
  const { view, setView, setActiveProject, setOnlyUrgent } = useTasksStore()
  const items = [
    { v: 'focus' as const, label: 'Foco', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 14 14">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
        <circle cx="7" cy="7" r="2" fill="currentColor"/>
      </svg>
    )},
    { v: 'calendar' as const, label: 'Cal.', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 14 14">
        <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <line x1="1.5" y1="6" x2="12.5" y2="6" stroke="currentColor" strokeWidth="1"/>
        <line x1="4.5" y1="1" x2="4.5" y2="4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <line x1="9.5" y1="1" x2="9.5" y2="4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    )},
    { v: 'notes' as const, label: 'Notas', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 14 14">
        <rect x="2" y="2" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <line x1="4" y1="5" x2="10" y2="5" stroke="currentColor" strokeWidth="1"/>
        <line x1="4" y1="7.5" x2="10" y2="7.5" stroke="currentColor" strokeWidth="1"/>
        <line x1="4" y1="10" x2="7" y2="10" stroke="currentColor" strokeWidth="1"/>
      </svg>
    )},
    { v: 'note' as const, label: 'Diário', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 14 14">
        <path d="M3 2h6l3 3v7a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M9 2v3h3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      </svg>
    )},
    { v: 'search' as const, label: 'Busca', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 14 14">
        <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3"/>
        <line x1="9" y1="9" x2="13" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    )},
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden z-30 flex items-center border-t"
      style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {items.map(({ v, label, icon }) => (
        <button
          key={v}
          onClick={() => { setActiveProject(null); setOnlyUrgent(false); setView(v) }}
          className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors"
          style={{ color: view === v ? 'var(--amber)' : 'var(--sidebar-text)' }}
        >
          {icon}
          {label}
        </button>
      ))}
      {/* Menu button */}
      <button
        onClick={onMenuOpen}
        className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors"
        style={{ color: 'var(--sidebar-text)' }}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 14 14">
          <line x1="1" y1="3.5" x2="13" y2="3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          <line x1="1" y1="7" x2="10" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          <line x1="1" y1="10.5" x2="7" y2="10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        Menu
      </button>
    </nav>
  )
}

export default function App() {
  const { tasks, loading, activeProject, activeTag, onlyUrgent, view, displayMode, fetchTasks } = useTasksStore()
  const { fetchProjects } = useProjectsStore()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
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

  // Close sidebar on view change (mobile)
  useEffect(() => { setSidebarOpen(false) }, [view, activeProject])

  const focusCapture = useCallback(() => {
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>('input[placeholder*="cabeça"]')
      el?.focus()
    }, 50)
  }, [])

  const MYSTIC_SOURCES = ['mystic_event', 'mystic_task']

  const visible = tasks.filter((t) => {
    if (onlyUrgent) return !t.done
    if (activeTag) return (t.tags ?? []).includes(activeTag)
    if (activeProject) return t.projects.includes(activeProject)
    // Foco do dia: esconde tarefas vindas do Mystic Fyah
    if (MYSTIC_SOURCES.includes(t.source)) return false
    return true
  })

  const title = onlyUrgent
    ? 'A Fazer'
    : activeTag
    ? `#${activeTag}`
    : activeProject
    ? activeProject.charAt(0).toUpperCase() + activeProject.slice(1)
    : 'Foco do dia'

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — fixed drawer on mobile, static on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transition-transform duration-200 md:static md:translate-x-0 md:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <ProjectSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Backdrop on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className={`flex-1 flex flex-col ${
        view === 'focus' && displayMode === 'kanban'
          ? 'px-4 md:px-6 py-6 md:py-8 overflow-x-auto'
          : 'px-4 md:px-8 py-6 md:py-10'
      } pb-20 md:pb-6`}>

        {view === 'focus' && onlyUrgent && (
          <div className="w-full">
            <h1 className="text-[21px] md:text-[24px] mb-6" style={{ color: 'var(--text-1)', fontFamily: 'Inter, sans-serif', fontWeight: 800, letterSpacing: '-0.04em' }}>{title}</h1>
            {loading ? (
              <div className="text-[13px] text-center py-12" style={{ color: 'var(--text-3)' }}>a carregar…</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
                {([
                  { key: 'alta',  label: 'Urgente', color: '#c8402e', bg: '#fff0ee' },
                  { key: 'média', label: 'Semana',  color: '#c07e1a', bg: '#fdf6e8' },
                  { key: 'baixa', label: 'Depois',  color: '#7d909e', bg: '#f0f4f7' },
                ] as const).map(({ key, label, color, bg }) => {
                  const col = visible.filter((t) => t.priority === key)
                  return (
                    <div key={key} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                      <div className="px-3 py-2.5 flex items-center justify-between" style={{ background: bg, borderBottom: '1px solid var(--border)' }}>
                        <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color, fontFamily: 'Inter, sans-serif' }}>{label}</span>
                        <span className="text-[11px] font-mono" style={{ color }}>{col.length}</span>
                      </div>
                      <div className="py-1" style={{ background: 'var(--surface)' }}>
                        {col.length === 0 ? (
                          <p className="text-[12px] text-center py-6" style={{ color: 'var(--text-3)' }}>vazio</p>
                        ) : (
                          <TaskList tasks={col} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {view === 'focus' && !onlyUrgent && (
          <div className={displayMode === 'kanban' ? 'w-full' : 'max-w-2xl mx-auto w-full'}>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-[21px] md:text-[24px]" style={{ color: 'var(--text-1)', fontFamily: 'Inter, sans-serif', fontWeight: 800, letterSpacing: '-0.04em' }}>{title}</h1>
              <ViewToggle />
            </div>

            {displayMode === 'list' && (
              <>
                <div className="mb-8"><CaptureBar /></div>
                {loading ? (
                  <div className="text-[13px] text-center py-12" style={{ color: 'var(--text-3)' }}>a carregar…</div>
                ) : (
                  <TaskList tasks={visible} />
                )}
                {activeProject && <ProjectNote projectId={activeProject} />}
              </>
            )}

            {displayMode === 'kanban' && <KanbanView tasks={visible} />}

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
          <div className="flex-1 flex min-h-0 -mx-4 md:-mx-8 -my-6 md:-my-10 mb-0">
            <FreeNotes />
          </div>
        )}

        {view === 'search' && (
          <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
            <SearchView />
          </div>
        )}
      </main>

      {/* Bottom nav — mobile only */}
      <BottomNav onMenuOpen={() => setSidebarOpen(true)} />

      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          onFocusCapture={focusCapture}
        />
      )}
    </div>
  )
}
