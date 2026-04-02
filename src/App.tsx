import { useEffect, useState, useRef, useCallback } from 'react'
import { useTasksStore } from './store/tasks'
import { useProjectsStore } from './store/projects'
import { useAuthStore } from './store/auth'
import Login from './components/Login'
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
import AdminPanel from './components/AdminPanel'
import TimeView from './components/TimeView'
import FocusMode from './components/FocusMode'
import { useReminders } from './hooks/useReminders'

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
  const { view, setView, setActiveProject, setOnlyUrgent, onlyUrgent, tasks } = useTasksStore()
  const { userId } = useAuthStore()

  const urgentCount = tasks.filter(
    (t) => !t.done && t.priority === 'alta' && (t.user_id === userId || (!t.user_id && userId === 'hugo'))
  ).length

  const items = [
    { v: 'focus' as const, label: 'Foco', active: view === 'focus' && !onlyUrgent, icon: (
      <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 14 14">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
        <circle cx="7" cy="7" r="2" fill="currentColor"/>
      </svg>
    )},
    { v: 'afazer' as const, label: 'A Fazer', active: onlyUrgent, badge: urgentCount, icon: (
      <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 14 14">
        <path d="M2 3h10M2 7h7M2 11h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="11.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.1"/>
        <line x1="11.5" y1="9.5" x2="11.5" y2="10.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        <circle cx="11.5" cy="10.5" r="0.4" fill="currentColor"/>
      </svg>
    )},
    { v: 'notes' as const, label: 'Notas', active: view === 'notes', icon: (
      <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 14 14">
        <rect x="2" y="2" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <line x1="4" y1="5" x2="10" y2="5" stroke="currentColor" strokeWidth="1"/>
        <line x1="4" y1="7.5" x2="10" y2="7.5" stroke="currentColor" strokeWidth="1"/>
        <line x1="4" y1="10" x2="7" y2="10" stroke="currentColor" strokeWidth="1"/>
      </svg>
    )},
    { v: 'note' as const, label: 'Diário', active: view === 'note', icon: (
      <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 14 14">
        <path d="M3 2h6l3 3v7a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M9 2v3h3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      </svg>
    )},
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden z-30 flex items-center border-t"
      style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {items.map(({ v, label, icon, active, badge }) => (
        <button
          key={v}
          onClick={() => {
            if (v === 'afazer') { setActiveProject(null); setOnlyUrgent(true); setView('focus') }
            else { setActiveProject(null); setOnlyUrgent(false); setView(v as 'focus' | 'notes' | 'note') }
          }}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors relative"
          style={{ color: active ? 'var(--amber)' : 'var(--sidebar-text)' }}
        >
          <span className="relative">
            {icon}
            {badge ? (
              <span className="absolute -top-1 -right-1.5 text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full"
                style={{ background: 'var(--amber)', color: '#fff' }}>
                {badge > 9 ? '9+' : badge}
              </span>
            ) : null}
          </span>
          {label}
        </button>
      ))}
      {/* Menu */}
      <button
        onClick={onMenuOpen}
        className="flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors"
        style={{ color: 'var(--sidebar-text)' }}
      >
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 14 14">
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
  const { userId } = useAuthStore()
  const { tasks, loading, activeProject, activeTag, onlyUrgent, view, displayMode, setDisplayMode, fetchTasks } = useTasksStore()
  const { fetchProjects } = useProjectsStore()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const captureRef = useRef<HTMLInputElement | null>(null)

  useReminders(tasks, userId)

  useEffect(() => { fetchTasks(); fetchProjects() }, [fetchTasks, fetchProjects])

  // Request notification permission on first load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Fire notification for urgent/overdue tasks (once per session)
  useEffect(() => {
    if (loading) return
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    if (sessionStorage.getItem('ob_notified')) return

    const today = new Date().toISOString().split('T')[0]
    const userTasks = tasks.filter((t) => t.user_id === userId || (!t.user_id && userId === 'hugo'))
    const urgent = userTasks.filter((t) => !t.done && (
      t.priority === 'alta' ||
      (t.due_date && t.due_date <= today)
    ))

    if (urgent.length > 0) {
      sessionStorage.setItem('ob_notified', '1')
      new Notification('OrgaBuddy', {
        body: `${urgent.length} tarefa${urgent.length > 1 ? 's' : ''} urgente${urgent.length > 1 ? 's' : ''} hoje`,
        icon: 'https://hugodubio.github.io/orgabuddy/favicon.ico',
      })
    }
  }, [loading, tasks, userId])

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

  if (!userId) return <Login />

  const MYSTIC_SOURCES = ['mystic_event', 'mystic_task']

  // Filter by user — legacy tasks (null user_id) only visible to hugo
  const userTasks = tasks.filter((t) => t.user_id === userId || (!t.user_id && userId === 'hugo'))

  const today = new Date().toISOString().split('T')[0]

  const visible = userTasks.filter((t) => {
    // Dentro de um projecto: mostra tudo
    if (activeProject) return t.projects.includes(activeProject)
    if (activeTag) return (t.tags ?? []).includes(activeTag)
    // Eventos do Mystic: só aparecem se forem hoje
    if (t.source === 'mystic_event') return t.due_date === today
    if (onlyUrgent) return !t.done
    // Foco do dia: esconde tarefas do Mystic (não-eventos)
    if (t.source === 'mystic_task') return false
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
          <div className={displayMode === 'list' ? 'max-w-2xl mx-auto w-full' : 'w-full'}>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-[21px] md:text-[24px]" style={{ color: 'var(--text-1)', fontFamily: 'Inter, sans-serif', fontWeight: 800, letterSpacing: '-0.04em' }}>{title}</h1>
              <div className="flex items-center gap-0.5 bg-[#f0f0ee] rounded-lg p-0.5">
                {([
                  { key: 'kanban', icon: <><rect x="1" y="1" width="3.5" height="12" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="5.25" y="1" width="3.5" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="9.5" y="1" width="3.5" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/></> },
                  { key: 'list',   icon: <><line x1="1" y1="3" x2="13" y2="3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="1" y1="11" x2="13" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></> },
                ] as const).map(({ key, icon }) => (
                  <button key={key} onClick={() => setDisplayMode(key)}
                    className={`p-1.5 rounded-md transition-colors ${displayMode === key ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#aaa] hover:text-[#666]'}`}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">{icon}</svg>
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="text-[13px] text-center py-12" style={{ color: 'var(--text-3)' }}>a carregar…</div>
            ) : displayMode === 'list' ? (
              <TaskList tasks={visible} />
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFocusMode(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all hover:scale-105"
                  style={{ background: 'var(--brand-secondary)', color: 'var(--brand-primary)' }}
                  title="Entrar em modo foco"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 12 12">
                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                    <circle cx="6" cy="6" r="2" fill="currentColor"/>
                  </svg>
                  Foco
                </button>
                <ViewToggle />
              </div>
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

        {view === 'admin' && (
          <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
            <AdminPanel />
          </div>
        )}

        {view === 'time' && (
          <div className="flex-1 flex flex-col px-4 py-6">
            <TimeView />
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

      {focusMode && userId && (
        <FocusMode userId={userId} onExit={() => setFocusMode(false)} />
      )}
    </div>
  )
}
