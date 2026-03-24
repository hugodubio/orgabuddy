import { useEffect, useState } from 'react'
import { useTasksStore } from '../store/tasks'
import { useProjectsStore } from '../store/projects'
import type { ProjectDef } from '../types'

function SyncIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      className={`w-3 h-3 ${spinning ? 'animate-spin' : ''}`}
      fill="none"
      viewBox="0 0 12 12"
    >
      <path
        d="M10 6a4 4 0 1 1-1.17-2.83"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <polyline points="10,2 10,5 7,5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function projectStyle(p: ProjectDef) {
  return {
    tag: `px-1.5 py-0.5 rounded-[3px] font-medium text-[11px]`,
    tagStyle: { background: p.color_bg, color: p.color_text },
    dotStyle: { background: p.dot_color },
  }
}

export function useProjectColors() {
  const { projects } = useProjectsStore()
  return (id: string) => projects.find((p) => p.id === id)
}

export default function ProjectSidebar() {
  const { tasks, syncing, activeProject, activeTag, onlyUrgent, view, setActiveProject, setActiveTag, setOnlyUrgent, setView, syncFromMystic } = useTasksStore()
  const { projects, fetchProjects, addProject, deleteProject } = useProjectsStore()
  const [adding, setAdding] = useState<string | null>(null) // null = top-level, string = parentId
  const [newLabel, setNewLabel] = useState('')
  const [hoveredProject, setHoveredProject] = useState<string | null>(null)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const handleSync = async () => {
    const { added } = await syncFromMystic()
    setSyncMsg(`↑ ${added} itens sincronizados`)
    setTimeout(() => setSyncMsg(null), 3000)
  }

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const countFor = (id: string) =>
    tasks.filter((t) => !t.done && t.projects.includes(id)).length

  const totalPending = tasks.filter((t) => !t.done).length

  const submitNew = async () => {
    const label = newLabel.trim()
    if (!label) return
    await addProject(label, adding ?? undefined)
    setNewLabel('')
    setAdding(null)
  }

  return (
    <aside className="w-[220px] shrink-0 bg-[#f7f7f5] h-screen sticky top-0 flex flex-col border-r border-[#ebebea]">
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-[#1a1a1a] flex items-center justify-center">
          <span className="text-white text-[10px] font-semibold">O</span>
        </div>
        <span className="text-[13px] font-semibold text-[#1a1a1a]">OrgaBuddy</span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-[#bbb] hover:text-[#666] transition-colors disabled:opacity-40"
            title="Sincronizar com Mystic Fyah"
          >
            <SyncIcon spinning={syncing} />
          </button>
          <span className="text-[10px] text-[#bbb] border border-[#e0e0de] rounded px-1">⌘K</span>
        </div>
      </div>

      {syncMsg && (
        <div className="mx-3 mb-1 text-[11px] text-[#10b981] bg-[#d1fae5] rounded px-2 py-1">
          {syncMsg}
        </div>
      )}

      <nav className="flex-1 px-2 overflow-y-auto">
        {/* Foco */}
        <button
          onClick={() => { setActiveProject(null); setOnlyUrgent(false); setView('focus') }}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[13px] mb-0.5 ${
            view === 'focus' && !activeProject && !onlyUrgent
              ? 'bg-white text-[#1a1a1a] shadow-sm'
              : 'text-[#6b6b6b] hover:bg-white/60'
          }`}
        >
          <span>Foco do dia</span>
          {totalPending > 0 && <span className="text-[11px] text-[#aaa]">{totalPending}</span>}
        </button>

        {/* Urgentes */}
        <button
          onClick={() => { setActiveProject(null); setOnlyUrgent(true); setView('focus') }}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[13px] mb-1 ${
            view === 'focus' && onlyUrgent
              ? 'bg-white text-[#1a1a1a] shadow-sm'
              : 'text-[#6b6b6b] hover:bg-white/60'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
          <span>Urgentes</span>
        </button>

        {/* Calendar */}
        <button
          onClick={() => { setActiveProject(null); setOnlyUrgent(false); setView('calendar') }}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[13px] mb-0.5 ${
            view === 'calendar' ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#6b6b6b] hover:bg-white/60'
          }`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
            <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <line x1="1" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="1" />
            <line x1="4" y1="1" x2="4" y2="3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="8" y1="1" x2="8" y2="3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span>Calendário</span>
        </button>

        {/* Notas livres */}
        <button
          onClick={() => { setActiveProject(null); setOnlyUrgent(false); setView('notes') }}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[13px] mb-0.5 ${
            view === 'notes' ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#6b6b6b] hover:bg-white/60'
          }`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
            <rect x="1.5" y="1.5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <line x1="3.5" y1="4" x2="8.5" y2="4" stroke="currentColor" strokeWidth="1" />
            <line x1="3.5" y1="6" x2="8.5" y2="6" stroke="currentColor" strokeWidth="1" />
            <line x1="3.5" y1="8" x2="6.5" y2="8" stroke="currentColor" strokeWidth="1" />
          </svg>
          <span>Notas</span>
        </button>

        {/* Graph + Note */}
        <button
          onClick={() => setView('graph')}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[13px] mb-0.5 ${
            view === 'graph' ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#6b6b6b] hover:bg-white/60'
          }`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
            <circle cx="2" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="10" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="10" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
            <line x1="3.4" y1="5.4" x2="8.7" y2="3.1" stroke="currentColor" strokeWidth="1" />
            <line x1="3.4" y1="6.6" x2="8.7" y2="8.9" stroke="currentColor" strokeWidth="1" />
          </svg>
          <span>Grafo</span>
        </button>

        <button
          onClick={() => setView('note')}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[13px] mb-3 ${
            view === 'note' ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#6b6b6b] hover:bg-white/60'
          }`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
            <rect x="1.5" y="1.5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <line x1="3.5" y1="4" x2="8.5" y2="4" stroke="currentColor" strokeWidth="1" />
            <line x1="3.5" y1="6" x2="8.5" y2="6" stroke="currentColor" strokeWidth="1" />
            <line x1="3.5" y1="8" x2="6.5" y2="8" stroke="currentColor" strokeWidth="1" />
          </svg>
          <span>Nota do dia</span>
        </button>

        {/* Projects header */}
        <div className="flex items-center justify-between px-2 mb-1">
          <p className="text-[10px] uppercase tracking-widest text-[#aaa] font-medium">Projetos</p>
          <button
            onClick={() => { setAdding(''); setNewLabel('') }}
            className="text-[#bbb] hover:text-[#666] transition-colors"
            title="Novo projeto"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
              <line x1="6" y1="2" x2="6" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Top-level projects */}
        {projects.filter((p) => !p.parent_id).map((p) => {
          const children = projects.filter((c) => c.parent_id === p.id)
          const isOpen = !collapsed[p.id]

          return (
            <div key={p.id}>
              <div
                className="relative"
                onMouseEnter={() => setHoveredProject(p.id)}
                onMouseLeave={() => setHoveredProject(null)}
              >
                <button
                  onClick={() => { setActiveProject(p.id); setOnlyUrgent(false); setView('focus') }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[13px] mb-0.5 ${
                    view === 'focus' && activeProject === p.id
                      ? 'bg-white text-[#1a1a1a] shadow-sm'
                      : 'text-[#6b6b6b] hover:bg-white/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {children.length > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setCollapsed((c) => ({ ...c, [p.id]: !c[p.id] })) }}
                        className="text-[#ccc] hover:text-[#666] shrink-0"
                      >
                        <svg className={`w-2.5 h-2.5 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 10 10">
                          <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )}
                    {children.length === 0 && (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.dot_color }} />
                    )}
                    <span className="truncate">{p.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {countFor(p.id) > 0 && (
                      <span className="text-[11px] text-[#aaa]">{countFor(p.id)}</span>
                    )}
                    {hoveredProject === p.id && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setAdding(p.id); setNewLabel('') }}
                          className="text-[#ccc] hover:text-[#666] transition-colors leading-none text-[14px]"
                          title="Adicionar sub-projecto"
                        >+</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteProject(p.id) }}
                          className="text-[#ccc] hover:text-red-400 transition-colors leading-none"
                          title="Apagar"
                        >×</button>
                      </>
                    )}
                  </div>
                </button>
              </div>

              {/* Sub-projects */}
              {isOpen && children.map((child) => (
                <div
                  key={child.id}
                  className="relative pl-4"
                  onMouseEnter={() => setHoveredProject(child.id)}
                  onMouseLeave={() => setHoveredProject(null)}
                >
                  <button
                    onClick={() => { setActiveProject(child.id); setOnlyUrgent(false); setView('focus') }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[13px] mb-0.5 ${
                      view === 'focus' && activeProject === child.id
                        ? 'bg-white text-[#1a1a1a] shadow-sm'
                        : 'text-[#6b6b6b] hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: child.dot_color }} />
                      <span className="truncate">{child.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {countFor(child.id) > 0 && (
                        <span className="text-[11px] text-[#aaa]">{countFor(child.id)}</span>
                      )}
                      {hoveredProject === child.id && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteProject(child.id) }}
                          className="text-[#ccc] hover:text-red-400 transition-colors leading-none"
                        >×</button>
                      )}
                    </div>
                  </button>
                </div>
              ))}

              {/* Inline add sub-project */}
              {adding === p.id && (
                <div className="pl-4 pr-2 mt-1 mb-1">
                  <input
                    autoFocus
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitNew()
                      if (e.key === 'Escape') setAdding(null)
                    }}
                    onBlur={() => { if (!newLabel.trim()) setAdding(null) }}
                    placeholder="nome do sub-projecto"
                    className="w-full bg-white border border-[#d0d0ce] rounded px-2 py-1.5 text-[13px] text-[#1a1a1a] outline-none placeholder:text-[#ccc]"
                  />
                  <p className="text-[10px] text-[#bbb] mt-1">↵ criar · esc cancelar</p>
                </div>
              )}
            </div>
          )
        })}

        {/* Add top-level project */}
        {adding === null && (
          <></>
        )}
        {adding === '' && (
          <div className="px-2 mt-1">
            <input
              autoFocus
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNew()
                if (e.key === 'Escape') setAdding(null)
              }}
              onBlur={() => { if (!newLabel.trim()) setAdding(null) }}
              placeholder="nome do projeto"
              className="w-full bg-white border border-[#d0d0ce] rounded px-2 py-1.5 text-[13px] text-[#1a1a1a] outline-none placeholder:text-[#ccc]"
            />
            <p className="text-[10px] text-[#bbb] mt-1">↵ criar · esc cancelar</p>
          </div>
        )}
        {/* Tags */}
        {(() => {
          const allTags = [...new Set(tasks.flatMap((t) => t.tags ?? []))]
          if (allTags.length === 0) return null
          return (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-widest text-[#aaa] font-medium px-2 mb-1">Tags</p>
              <div className="flex flex-wrap gap-1 px-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => { setActiveTag(activeTag === tag ? null : tag) }}
                    className={`text-[11px] px-1.5 py-0.5 rounded-[3px] transition-colors ${
                      activeTag === tag
                        ? 'bg-[#3b82f6] text-white'
                        : 'bg-[#eff6ff] text-[#3b82f6] hover:bg-[#dbeafe]'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )
        })()}
      </nav>
    </aside>
  )
}
