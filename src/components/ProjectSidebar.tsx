import { useEffect, useState, useMemo } from 'react'
import { useTasksStore } from '../store/tasks'
import { useProjectsStore } from '../store/projects'
import { useAuthStore } from '../store/auth'
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

export default function ProjectSidebar({ onClose }: { onClose?: () => void }) {
  const { tasks, syncing, activeProject, activeTag, onlyUrgent, view, setActiveProject, setActiveTag, setOnlyUrgent, setView, syncFromMystic, fetchTasks } = useTasksStore()
  const { userName, logout } = useAuthStore()
  const { projects, fetchProjects, addProject, deleteProject, updateProject } = useProjectsStore()
  const [adding, setAdding] = useState<string | null>(null) // null = top-level, string = parentId
  const [newLabel, setNewLabel] = useState('')
  const [hoveredProject, setHoveredProject] = useState<string | null>(null)
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editPalette, setEditPalette] = useState(0)
  const [editKeywords, setEditKeywords] = useState('')
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const handleSync = async () => {
    try {
      const { added } = await syncFromMystic()
      setSyncMsg(`↑ ${added} itens sincronizados`)
    } catch {
      setSyncMsg('Erro ao sincronizar')
    }
    setTimeout(() => setSyncMsg(null), 3000)
  }

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const pendingByProject = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of tasks) {
      if (t.done) continue
      for (const pid of t.projects) {
        map[pid] = (map[pid] ?? 0) + 1
      }
    }
    return map
  }, [tasks])

  const countFor = (id: string) => pendingByProject[id] ?? 0
  const totalPending = tasks.filter((t) => !t.done).length

  const PALETTES = [
    { color_bg: '#fef9c3', color_text: '#854d0e', dot_color: '#eab308' },
    { color_bg: '#dcfce7', color_text: '#166534', dot_color: '#22c55e' },
    { color_bg: '#fee2e2', color_text: '#991b1b', dot_color: '#ef4444' },
    { color_bg: '#e0f2fe', color_text: '#075985', dot_color: '#0ea5e9' },
    { color_bg: '#f3e8ff', color_text: '#6b21a8', dot_color: '#a855f7' },
    { color_bg: '#fff7ed', color_text: '#9a3412', dot_color: '#f97316' },
    { color_bg: '#f0fdf4', color_text: '#14532d', dot_color: '#16a34a' },
  ]

  const startEdit = (p: ProjectDef) => {
    setEditingProject(p.id)
    setEditLabel(p.label)
    setEditKeywords((p.keywords ?? []).join(', '))
    const idx = PALETTES.findIndex((pal) => pal.dot_color === p.dot_color)
    setEditPalette(idx >= 0 ? idx : 0)
  }

  const submitEdit = async () => {
    if (!editingProject || !editLabel.trim()) { setEditingProject(null); return }
    const keywords = editKeywords.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean)
    await updateProject(editingProject, editLabel.trim(), PALETTES[editPalette], keywords)
    setEditingProject(null)
  }

  const submitNew = async () => {
    const label = newLabel.trim()
    if (!label) return
    await addProject(label, adding ?? undefined)
    setNewLabel('')
    setAdding(null)
  }

  // helper classes — left amber border on active
  const navBtn = (active: boolean) =>
    `w-full flex items-center gap-2.5 py-[7px] pr-3 text-[13px] transition-all rounded-r-md ${
      active
        ? 'pl-[10px] border-l-[2px] border-[var(--amber)] bg-[#1d1a15] text-[var(--sidebar-text-active)]'
        : 'pl-3 border-l-[2px] border-transparent text-[var(--sidebar-text)] hover:bg-[#181510] hover:text-[#c8bfb4]'
    }`

  return (
    <aside className="w-[228px] shrink-0 h-screen sticky top-0 flex flex-col" style={{ background: 'var(--sidebar-bg)' }}>
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        <div className="w-5 h-5 flex items-center justify-center shrink-0" style={{ background: 'var(--amber)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
          <span className="text-white text-[9px] font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>O</span>
        </div>
        <span className="text-[13px]" style={{ color: 'var(--sidebar-text-active)', fontFamily: 'Inter, sans-serif', fontWeight: 800, letterSpacing: '-0.02em' }}>OrgaBuddy</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="transition-colors disabled:opacity-30"
            style={{ color: 'var(--sidebar-text)' }}
            title="Sincronizar com Mystic Fyah"
          >
            <SyncIcon spinning={syncing} />
          </button>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono hidden md:inline" style={{ color: '#5a5248', background: '#2a2520', letterSpacing: '0.05em' }}>⌘K</span>
          {onClose && (
            <button onClick={onClose} className="md:hidden text-lg leading-none" style={{ color: 'var(--sidebar-text)' }}>×</button>
          )}
        </div>
      </div>

      {syncMsg && (
        <div className="mx-3 mt-2 text-[11px] rounded-md px-2.5 py-1.5" style={{
          color: syncMsg.includes('Erro') ? '#f87171' : '#6ee7b7',
          background: syncMsg.includes('Erro') ? '#2d1a1a' : '#162a22'
        }}>
          {syncMsg}
        </div>
      )}

      <nav className="flex-1 px-2 pt-3 overflow-y-auto space-y-0.5">
        {/* Foco */}
        <button
          onClick={() => { setActiveProject(null); setOnlyUrgent(false); setView('focus') }}
          className={navBtn(view === 'focus' && !activeProject && !onlyUrgent && !activeTag)}
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 14 14">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
            <circle cx="7" cy="7" r="2" fill="currentColor"/>
          </svg>
          <span>Foco do dia</span>
          {totalPending > 0 && <span className="ml-auto text-[11px]" style={{ color: '#5a5248' }}>{totalPending}</span>}
        </button>

        <button
          onClick={() => { setActiveProject(null); setOnlyUrgent(true); setView('focus') }}
          className={navBtn(view === 'focus' && onlyUrgent)}
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 14 14">
            <rect x="1.5" y="1.5" width="4.5" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/>
            <rect x="8" y="1.5" width="4.5" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
          <span>A Fazer</span>
          {tasks.filter((t) => !t.done).length > 0 && (
            <span className="ml-auto text-[11px]" style={{ color: '#5a5248' }}>{tasks.filter((t) => !t.done).length}</span>
          )}
        </button>

        <button
          onClick={() => { setActiveProject(null); setOnlyUrgent(false); setView('calendar') }}
          className={navBtn(view === 'calendar')}
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 14 14">
            <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
            <line x1="1.5" y1="6" x2="12.5" y2="6" stroke="currentColor" strokeWidth="1"/>
            <line x1="4.5" y1="1" x2="4.5" y2="4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            <line x1="9.5" y1="1" x2="9.5" y2="4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <span>Calendário</span>
        </button>

<button
          onClick={() => { setActiveProject(null); setOnlyUrgent(false); setView('notes') }}
          className={navBtn(view === 'notes')}
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 14 14">
            <rect x="2" y="2" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
            <line x1="4" y1="5" x2="10" y2="5" stroke="currentColor" strokeWidth="1"/>
            <line x1="4" y1="7.5" x2="10" y2="7.5" stroke="currentColor" strokeWidth="1"/>
            <line x1="4" y1="10" x2="7" y2="10" stroke="currentColor" strokeWidth="1"/>
          </svg>
          <span>Notas</span>
        </button>

        <button
          onClick={() => setView('graph')}
          className={navBtn(view === 'graph')}
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 14 14">
            <circle cx="2.5" cy="7" r="1.8" stroke="currentColor" strokeWidth="1.2"/>
            <circle cx="11.5" cy="3" r="1.8" stroke="currentColor" strokeWidth="1.2"/>
            <circle cx="11.5" cy="11" r="1.8" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="4.2" y1="6.2" x2="9.8" y2="3.8" stroke="currentColor" strokeWidth="1"/>
            <line x1="4.2" y1="7.8" x2="9.8" y2="10.2" stroke="currentColor" strokeWidth="1"/>
          </svg>
          <span>Grafo</span>
        </button>

        <button
          onClick={() => { setActiveProject(null); setOnlyUrgent(false); setView('search') }}
          className={navBtn(view === 'search')}
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 14 14">
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3"/>
            <line x1="9" y1="9" x2="13" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <span>Pesquisar</span>
        </button>

        <button
          onClick={() => setView('note')}
          className={`${navBtn(view === 'note')} mb-4`}
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 14 14">
            <path d="M3 2h6l3 3v7a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M9 2v3h3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          </svg>
          <span>Nota do dia</span>
        </button>

        {/* Projects header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
          <p className="label-caps">Projetos</p>
          <button
            onClick={() => { setAdding(''); setNewLabel('') }}
            style={{ color: '#4a4540' }}
            className="hover:text-[#c8bfb4] transition-colors"
            title="Novo projeto"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
              <line x1="6" y1="2" x2="6" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Top-level projects */}
        {projects.filter((p) => !p.parent_id).map((p) => {
          const children = projects.filter((c) => c.parent_id === p.id)
          const isOpen = !collapsed[p.id]
          const isActive = view === 'focus' && activeProject === p.id

          return (
            <div key={p.id}>
              <div
                className="relative"
                onMouseEnter={() => setHoveredProject(p.id)}
                onMouseLeave={() => setHoveredProject(null)}
              >
                <button
                  onClick={() => { setActiveProject(p.id); setOnlyUrgent(false); setView('focus') }}
                  className={navBtn(isActive)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {children.length > 0 ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); setCollapsed((c) => ({ ...c, [p.id]: !c[p.id] })) }}
                        className="shrink-0 opacity-50 hover:opacity-100"
                      >
                        <svg className={`w-2.5 h-2.5 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 10 10">
                          <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.dot_color }} />
                    )}
                    <span className="truncate">{p.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {countFor(p.id) > 0 && !hoveredProject && (
                      <span className="text-[11px]" style={{ color: '#4a4540' }}>{countFor(p.id)}</span>
                    )}
                    {hoveredProject === p.id && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); startEdit(p) }}
                          className="opacity-50 hover:opacity-100" title="Editar">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                            <path d="M8.5 1.5l2 2-6 6H2.5v-2l6-6z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setAdding(p.id); setNewLabel('') }}
                          className="opacity-50 hover:opacity-100 leading-none text-[15px]">+</button>
                        <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id) }}
                          className="opacity-50 hover:opacity-100 leading-none" style={{ color: 'var(--red)' }}>×</button>
                      </>
                    )}
                  </div>
                </button>
              </div>

              {/* Inline edit */}
              {editingProject === p.id && (
                <div className="mx-2 mb-2 p-2.5 rounded-lg space-y-2" style={{ background: '#1a1713', border: '1px solid #2a2520' }}>
                  <input
                    autoFocus
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitEdit()
                      if (e.key === 'Escape') setEditingProject(null)
                    }}
                    className="sidebar-input w-full rounded px-2 py-1.5 text-[13px] outline-none"
                    style={{ background: '#2a2520', border: '1px solid #3a342e', color: 'var(--sidebar-text-active)' }}
                  />
                  <input
                    value={editKeywords}
                    onChange={(e) => setEditKeywords(e.target.value)}
                    placeholder="palavras-chave, separadas por vírgula"
                    className="sidebar-input w-full rounded px-2 py-1.5 text-[12px] outline-none"
                    style={{ background: '#2a2520', border: '1px solid #3a342e', color: 'var(--sidebar-text-active)' }}
                  />
                  <div className="flex gap-1.5">
                    {PALETTES.map((pal, i) => (
                      <button
                        key={i}
                        onClick={() => setEditPalette(i)}
                        className="w-4 h-4 rounded-full transition-transform"
                        style={{
                          background: pal.dot_color,
                          outline: editPalette === i ? `2px solid ${pal.dot_color}` : 'none',
                          outlineOffset: '2px',
                          transform: editPalette === i ? 'scale(1.2)' : 'scale(1)',
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={submitEdit}
                      className="text-[11px] px-2 py-1 rounded font-medium"
                      style={{ background: 'var(--amber)', color: '#fff' }}>guardar</button>
                    <button onClick={() => setEditingProject(null)}
                      className="text-[11px] px-2 py-1 rounded"
                      style={{ color: 'var(--sidebar-text)' }}>cancelar</button>
                  </div>
                </div>
              )}

              {/* Sub-projects */}
              {isOpen && children.map((child) => (
                <div key={child.id} className="pl-5"
                  onMouseEnter={() => setHoveredProject(child.id)}
                  onMouseLeave={() => setHoveredProject(null)}
                >
                  <button
                    onClick={() => { setActiveProject(child.id); setOnlyUrgent(false); setView('focus') }}
                    className={navBtn(view === 'focus' && activeProject === child.id)}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: child.dot_color }} />
                    <span className="truncate flex-1">{child.label}</span>
                    {countFor(child.id) > 0 && hoveredProject !== child.id && (
                      <span className="text-[11px]" style={{ color: '#4a4540' }}>{countFor(child.id)}</span>
                    )}
                    {hoveredProject === child.id && (
                      <button onClick={(e) => { e.stopPropagation(); deleteProject(child.id) }}
                        className="opacity-50 hover:opacity-100 leading-none" style={{ color: 'var(--red)' }}>×</button>
                    )}
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
                    className="sidebar-input w-full rounded px-2 py-1.5 text-[13px] outline-none"
                    style={{ background: '#2a2520', border: '1px solid #3a342e', color: 'var(--sidebar-text-active)' }}
                  />
                  <p className="text-[10px] mt-1" style={{ color: '#4a4540' }}>↵ criar · esc cancelar</p>
                </div>
              )}
            </div>
          )
        })}

        {/* Add top-level project */}
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
              className="w-full rounded px-2 py-1.5 text-[13px] outline-none"
              style={{ background: '#2a2520', border: '1px solid #3a342e', color: 'var(--sidebar-text-active)' }}
            />
            <p className="text-[10px] mt-1" style={{ color: '#4a4540' }}>↵ criar · esc cancelar</p>
          </div>
        )}
        {/* Tags */}
        {(() => {
          const allTags = [...new Set(tasks.flatMap((t) => t.tags ?? []))]
          if (allTags.length === 0) return null
          return (
            <div className="mt-3 mb-3">
              <p className="text-[10px] uppercase tracking-widest font-medium px-3 mb-1.5" style={{ color: '#4a4540', letterSpacing: '0.1em' }}>Tags</p>
              <div className="flex flex-wrap gap-1 px-3">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => { setActiveTag(activeTag === tag ? null : tag) }}
                    className="text-[11px] px-1.5 py-0.5 rounded-[3px] transition-colors"
                    style={activeTag === tag
                      ? { background: 'var(--amber)', color: '#fff' }
                      : { background: '#2a2520', color: '#7a7068' }
                    }
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )
        })()}
      </nav>

      {/* User footer */}
      <div className="px-4 py-3 flex items-center gap-2.5" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
          style={{ background: 'var(--amber)', fontFamily: 'Inter, sans-serif' }}>
          {userName?.slice(0, 2).toUpperCase()}
        </div>
        <span className="text-[12px]" style={{ color: 'var(--sidebar-text-active)' }}>{userName}</span>
      </div>
    </aside>
  )
}
