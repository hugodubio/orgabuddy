import { useState, useRef, useCallback } from 'react'
import type { Task, Priority } from '../types'
import { useTasksStore } from '../store/tasks'
import { useProjectsStore } from '../store/projects'

const PRIORITY_CONFIG: { key: Priority; label: string; color: string; bg: string }[] = [
  { key: 'alta',  label: 'Urgente',  color: '#d95b4a', bg: '#fff0ee' },
  { key: 'média', label: 'Semana',   color: '#c8922a', bg: '#fdf6e8' },
  { key: 'baixa', label: 'Depois',   color: '#8a9aaa', bg: '#f0f4f7' },
]

interface Props {
  task: Task
}

export default function TaskCard({ task }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [editingText, setEditingText] = useState(false)
  const [textVal, setTextVal] = useState(task.text)
  const [newUrl, setNewUrl] = useState('')
  const [addingUrl, setAddingUrl] = useState(false)
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { toggleDone, deleteTask, tasks, updateLinks, updateExternalLinks, updateTaskField, updateProjects } = useTasksStore()
  const { projects } = useProjectsStore()

  const linkedTasks = tasks.filter((t) => task.links.includes(t.id))
  const backlinks = tasks.filter((t) => t.links.includes(task.id))
  const externalLinks: string[] = task.external_links ?? []
  const tags: string[] = task.tags ?? []

  const getProject = (id: string) => projects.find((p) => p.id === id)
  const priorityCfg = PRIORITY_CONFIG.find((p) => p.key === task.priority) ?? PRIORITY_CONFIG[1]

  const removeLink = async (linkId: number) => {
    await updateLinks(task.id, task.links.filter((id) => id !== linkId))
  }

  const addExternalLink = async () => {
    const url = newUrl.trim()
    if (!url) return
    const withProtocol = url.startsWith('http') ? url : `https://${url}`
    await updateExternalLinks(task.id, [...externalLinks, withProtocol])
    setNewUrl('')
    setAddingUrl(false)
  }

  const removeExternalLink = async (url: string) => {
    await updateExternalLinks(task.id, externalLinks.filter((u) => u !== url))
  }

  const hostname = (url: string) => {
    try { return new URL(url).hostname.replace('www.', '') }
    catch { return url }
  }

  const saveText = async () => {
    const trimmed = textVal.trim()
    if (trimmed && trimmed !== task.text) {
      await updateTaskField(task.id, { text: trimmed })
    } else {
      setTextVal(task.text)
    }
    setEditingText(false)
  }

  const onNoteChange = useCallback((val: string) => {
    if (noteTimer.current) clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => {
      updateTaskField(task.id, { note: val })
    }, 800)
  }, [task.id, updateTaskField])

  return (
    <div className={`group rounded-lg transition-colors ${task.done ? 'opacity-40' : ''}`}>
      {/* Row */}
      <div
        className="flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer relative overflow-hidden"
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
      >
        {/* Checkbox */}
        <button
          onClick={() => toggleDone(task.id)}
          className="mt-0.5 w-4 h-4 rounded shrink-0 flex items-center justify-center transition-colors"
          style={{ border: '1px solid var(--border)' }}
        >
          {task.done && (
            <svg className="w-2.5 h-2.5" style={{ color: 'var(--text-3)' }} viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={() => setExpanded(!expanded)}>
          <p className={`text-[13.5px] leading-snug ${task.done ? 'line-through' : ''}`}
            style={{ color: task.done ? 'var(--text-3)' : 'var(--text-1)' }}>
            {task.text}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {/* Priority pill */}
            <span className="text-[9px] px-1.5 py-[3px] font-bold tracking-wider uppercase"
              style={{ background: priorityCfg.bg, color: priorityCfg.color, fontFamily: 'Syne, sans-serif', borderRadius: '2px' }}>
              {priorityCfg.label}
            </span>

            {task.projects.map((pid) => {
              const p = getProject(pid)
              return p ? (
                <span key={pid} className="text-[11px] px-1.5 py-0.5 rounded-[3px] font-medium"
                  style={{ background: p.color_bg, color: p.color_text }}>
                  {p.label}
                </span>
              ) : null
            })}

            {tags.map((tag) => (
              <span key={tag} className="text-[11px] px-1.5 py-0.5 rounded-[3px]"
                style={{ background: 'var(--amber-bg)', color: 'var(--amber)' }}>
                #{tag}
              </span>
            ))}

            {task.note && (
              <span className="text-[10px] px-1 py-0.5 rounded-[3px]" style={{ color: 'var(--text-3)' }}>📝</span>
            )}

            {task.source === 'gmail' && (
              <a href={`https://mail.google.com/mail/u/0/#inbox/${task.source_email_id}`}
                target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] px-1.5 py-0.5 rounded-[3px] flex items-center gap-1"
                style={{ background: 'var(--bg)', color: 'var(--text-2)' }}>
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 16 16">
                  <path d="M2 4h12v8H2V4zm0 0l6 5 6-5" stroke="currentColor" strokeWidth="1.2" />
                </svg>
                gmail
              </a>
            )}
            {task.source === 'mystic_event' && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-[3px] bg-[#d1fae5] text-[#065f46]">🎵 gig</span>
            )}
            {task.source === 'mystic_task' && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-[3px] bg-[#d1fae5] text-[#065f46]">mystic</span>
            )}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={(e) => { e.stopPropagation(); deleteTask(task.id) }}
          className="opacity-0 group-hover:opacity-100 mt-0.5 w-5 h-5 flex items-center justify-center transition-all shrink-0"
          style={{ color: 'var(--text-3)' }}
        >×</button>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="mx-3 mb-2 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
          onClick={(e) => e.stopPropagation()}>

          {/* Title edit */}
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border-soft)' }}>
            {editingText ? (
              <textarea
                autoFocus
                value={textVal}
                onChange={(e) => setTextVal(e.target.value)}
                onBlur={saveText}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveText() }
                  if (e.key === 'Escape') { setTextVal(task.text); setEditingText(false) }
                }}
                rows={2}
                className="w-full text-[15px] font-medium leading-snug outline-none resize-none bg-transparent"
                style={{ color: 'var(--text-1)' }}
              />
            ) : (
              <p
                className="text-[15px] font-medium leading-snug cursor-text"
                style={{ color: 'var(--text-1)' }}
                onClick={() => { setEditingText(true); setTextVal(task.text) }}
                title="Clica para editar"
              >
                {task.text}
              </p>
            )}
          </div>

          {/* Priority + Type + Projects selectors */}
          <div className="px-4 py-3 flex flex-wrap gap-4" style={{ borderBottom: '1px solid var(--border-soft)' }}>
            {/* Priority */}
            <div>
              <p className="label-caps mb-1.5">Prioridade</p>
              <div className="flex gap-1">
                {PRIORITY_CONFIG.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => updateTaskField(task.id, { priority: p.key })}
                    className="text-[11px] px-2 py-1 rounded-md font-medium transition-all"
                    style={task.priority === p.key
                      ? { background: p.color, color: '#fff' }
                      : { background: p.bg, color: p.color, opacity: 0.6 }
                    }
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type */}
            <div>
              <p className="label-caps mb-1.5">Tipo</p>
              <div className="flex gap-1">
                {(['tarefa', 'ideia'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => updateTaskField(task.id, { type: t })}
                    className="text-[11px] px-2 py-1 rounded-md font-medium transition-all"
                    style={task.type === t
                      ? { background: 'var(--text-1)', color: '#fff' }
                      : { background: 'var(--bg)', color: 'var(--text-2)', opacity: 0.6 }
                    }
                  >
                    {t === 'tarefa' ? '✓ Tarefa' : '💡 Ideia'}
                  </button>
                ))}
              </div>
            </div>
            {/* Projects */}
            <div>
              <p className="label-caps mb-1.5">Projecto</p>
              <div className="flex flex-wrap gap-1">
                {projects.filter((p) => !p.parent_id).map((p) => {
                  const active = task.projects.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        const next = active
                          ? task.projects.filter((id) => id !== p.id)
                          : [...task.projects, p.id]
                        updateProjects(task.id, next)
                      }}
                      className="text-[11px] px-2 py-1 rounded-md font-medium transition-all"
                      style={active
                        ? { background: p.color_bg, color: p.color_text, outline: `1.5px solid ${p.dot_color}` }
                        : { background: 'var(--bg)', color: 'var(--text-3)', opacity: 0.6 }
                      }
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="px-4 py-3" style={{ borderBottom: linkedTasks.length > 0 || backlinks.length > 0 || externalLinks.length > 0 ? '1px solid var(--border-soft)' : 'none' }}>
            <p className="label-caps mb-1.5">Notas</p>
            <textarea
              defaultValue={task.note ?? ''}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Adiciona contexto, próximos passos, links…"
              rows={4}
              className="w-full text-[13px] leading-relaxed outline-none resize-none bg-transparent placeholder:text-[var(--text-3)]"
              style={{ color: 'var(--text-1)' }}
            />
          </div>

          {/* Links + Backlinks + External */}
          {(linkedTasks.length > 0 || backlinks.length > 0 || externalLinks.length > 0 || addingUrl) && (
            <div className="px-4 py-3 space-y-3">
              {linkedTasks.length > 0 && (
                <div>
                  <p className="label-caps mb-1">Ligações</p>
                  <div className="space-y-1">
                    {linkedTasks.map((lt) => (
                      <div key={lt.id} className="flex items-center gap-1 group/link">
                        <span className="text-[11px] rounded px-1.5 py-0.5 flex-1 truncate"
                          style={{ color: 'var(--text-2)', background: 'var(--bg)' }}>
                          → {lt.text}
                        </span>
                        <button onClick={() => removeLink(lt.id)}
                          className="opacity-0 group-hover/link:opacity-100 text-xs"
                          style={{ color: 'var(--text-3)' }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {backlinks.length > 0 && (
                <div>
                  <p className="label-caps mb-1">Referenciado por</p>
                  <div className="space-y-1">
                    {backlinks.map((bl) => (
                      <span key={bl.id} className="block text-[11px] rounded px-1.5 py-0.5 truncate"
                        style={{ color: 'var(--text-2)', background: 'var(--bg)' }}>
                        ← {bl.text}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(externalLinks.length > 0 || addingUrl) && (
                <div>
                  <p className="label-caps mb-1">Links</p>
                  <div className="space-y-1">
                    {externalLinks.map((url) => (
                      <div key={url} className="flex items-center gap-1 group/extlink">
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] hover:underline truncate flex-1"
                          style={{ color: 'var(--amber)' }}>
                          {hostname(url)}
                        </a>
                        <button onClick={() => removeExternalLink(url)}
                          className="opacity-0 group-hover/extlink:opacity-100 text-xs text-red-400">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add link footer */}
          <div className="px-4 pb-3">
            {addingUrl ? (
              <div className="flex gap-1">
                <input
                  autoFocus
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addExternalLink()
                    if (e.key === 'Escape') { setAddingUrl(false); setNewUrl('') }
                  }}
                  placeholder="https://..."
                  className="flex-1 text-[12px] rounded px-2 py-1 outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                />
                <button onClick={addExternalLink}
                  className="text-[12px] px-2 py-1 rounded text-white"
                  style={{ background: 'var(--text-1)' }}>ok</button>
              </div>
            ) : (
              <button
                onClick={() => setAddingUrl(true)}
                className="text-[11px] flex items-center gap-1"
                style={{ color: 'var(--text-3)' }}
              >
                + link externo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
