import { useState } from 'react'
import type { Task } from '../types'
import { useTasksStore } from '../store/tasks'
import { useProjectsStore } from '../store/projects'

interface Props {
  task: Task
}

export default function TaskCard({ task }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [addingUrl, setAddingUrl] = useState(false)
  const { toggleDone, deleteTask, tasks, updateLinks, updateExternalLinks } = useTasksStore()
  const { projects } = useProjectsStore()

  const linkedTasks = tasks.filter((t) => task.links.includes(t.id))
  const backlinks = tasks.filter((t) => t.links.includes(task.id))
  const externalLinks: string[] = task.external_links ?? []
  const tags: string[] = task.tags ?? []

  const getProject = (id: string) => projects.find((p) => p.id === id)

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

  return (
    <div
      className={`group flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-[#f7f7f5] transition-colors cursor-pointer ${
        task.done ? 'opacity-50' : ''
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => toggleDone(task.id)}
        className="mt-0.5 w-4 h-4 rounded border border-[#d0d0ce] shrink-0 flex items-center justify-center hover:border-[#aaa] transition-colors"
      >
        {task.done && (
          <svg className="w-2.5 h-2.5 text-[#aaa]" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0" onClick={() => setExpanded(!expanded)}>
        <p className={`text-[13.5px] leading-snug ${task.done ? 'line-through text-[#aaa]' : 'text-[#1a1a1a]'}`}>
          {task.text}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {task.projects.map((pid) => {
            const p = getProject(pid)
            return p ? (
              <span key={pid} className="text-[11px] px-1.5 py-0.5 rounded-[3px] font-medium"
                style={{ background: p.color_bg, color: p.color_text }}>
                {p.label}
              </span>
            ) : (
              <span key={pid} className="text-[11px] px-1.5 py-0.5 rounded-[3px] bg-[#f3f4f6] text-[#6b7280]">
                {pid}
              </span>
            )
          })}

          {tags.map((tag) => (
            <span key={tag} className="text-[11px] px-1.5 py-0.5 rounded-[3px] bg-[#eff6ff] text-[#3b82f6]">
              #{tag}
            </span>
          ))}

          {task.type === 'ideia' && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-[3px] bg-[#f3f4f6] text-[#6b7280]">ideia</span>
          )}
          {task.source === 'gmail' && (
            <a href={`https://mail.google.com/mail/u/0/#inbox/${task.source_email_id}`}
              target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] px-1.5 py-0.5 rounded-[3px] bg-[#f3f4f6] text-[#6b7280] flex items-center gap-1 hover:bg-[#e5e7eb]">
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 16 16">
                <path d="M2 4h12v8H2V4zm0 0l6 5 6-5" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              via gmail
            </a>
          )}
          {task.source === 'mystic_event' && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-[3px] bg-[#d1fae5] text-[#065f46]">🎵 gig</span>
          )}
          {task.source === 'mystic_task' && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-[3px] bg-[#d1fae5] text-[#065f46]">mystic</span>
          )}
        </div>

        {/* Expanded */}
        {expanded && (
          <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
            {task.reason && (
              <p className="text-[12px] text-[#6b6b6b] leading-relaxed border-l-2 border-[#e0e0de] pl-2">
                {task.reason}
              </p>
            )}

            {/* Links entre tarefas */}
            {linkedTasks.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#bbb] mb-1">ligações</p>
                <div className="space-y-1">
                  {linkedTasks.map((lt) => (
                    <div key={lt.id} className="flex items-center gap-1 group/link">
                      <span className="text-[11px] text-[#6b6b6b] bg-[#f0f0ee] rounded px-1.5 py-0.5 flex-1 truncate">
                        → {lt.text}
                      </span>
                      <button onClick={() => removeLink(lt.id)}
                        className="opacity-0 group-hover/link:opacity-100 text-[#bbb] hover:text-[#888] text-xs">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Backlinks */}
            {backlinks.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#bbb] mb-1">referenciado por</p>
                <div className="space-y-1">
                  {backlinks.map((bl) => (
                    <span key={bl.id} className="block text-[11px] text-[#6b6b6b] bg-[#f0f0ee] rounded px-1.5 py-0.5 truncate">
                      ← {bl.text}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Links externos */}
            {(externalLinks.length > 0 || addingUrl) && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#bbb] mb-1">links</p>
                <div className="space-y-1">
                  {externalLinks.map((url) => (
                    <div key={url} className="flex items-center gap-1 group/extlink">
                      <a href={url} target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] text-[#3b82f6] hover:underline truncate flex-1">
                        {hostname(url)}
                      </a>
                      <button onClick={() => removeExternalLink(url)}
                        className="opacity-0 group-hover/extlink:opacity-100 text-[#bbb] hover:text-red-400 text-xs">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                  className="flex-1 text-[12px] bg-[#f7f7f5] border border-[#d0d0ce] rounded px-2 py-1 outline-none"
                />
                <button onClick={addExternalLink}
                  className="text-[12px] px-2 py-1 bg-[#1a1a1a] text-white rounded">ok</button>
              </div>
            ) : (
              <button
                onClick={() => setAddingUrl(true)}
                className="text-[11px] text-[#bbb] hover:text-[#666] flex items-center gap-1"
              >
                <span>+</span> adicionar link
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); deleteTask(task.id) }}
        className="opacity-0 group-hover:opacity-100 mt-0.5 w-5 h-5 flex items-center justify-center text-[#bbb] hover:text-[#888] transition-all shrink-0"
      >×</button>
    </div>
  )
}
