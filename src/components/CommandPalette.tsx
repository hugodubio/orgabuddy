import { useState, useEffect, useRef } from 'react'
import { useTasksStore } from '../store/tasks'
import { useProjectsStore } from '../store/projects'
import { useNotesStore } from '../store/notes'

interface Props {
  onClose: () => void
  onFocusCapture: () => void
}

export default function CommandPalette({ onClose, onFocusCapture }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const { tasks, setActiveProject, setActiveTag, setOnlyUrgent, setView } = useTasksStore()
  const { projects } = useProjectsStore()
  const { notes, selectNote } = useNotesStore()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  type Item =
    | { kind: 'action'; label: string; hint?: string; fn: () => void }
    | { kind: 'task'; id: number; text: string; fn: () => void }
    | { kind: 'note'; id: number; title: string; fn: () => void }

  const navActions: Item[] = [
    { kind: 'action', label: 'Nova tarefa', hint: '↵', fn: () => { onClose(); onFocusCapture() } },
    { kind: 'action', label: 'Foco do dia', fn: () => { setView('focus'); setActiveProject(null); onClose() } },
    { kind: 'action', label: 'Só urgentes', fn: () => { setOnlyUrgent(true); onClose() } },
    { kind: 'action', label: 'Calendário', fn: () => { setView('calendar'); onClose() } },
    { kind: 'action', label: 'Notas', fn: () => { setView('notes'); onClose() } },
    { kind: 'action', label: 'Grafo', fn: () => { setView('graph'); onClose() } },
    { kind: 'action', label: 'Nota do dia', fn: () => { setView('note'); onClose() } },
    ...projects.map((p) => ({
      kind: 'action' as const,
      label: `Projeto: ${p.label}`,
      fn: () => { setActiveProject(p.id); setView('focus'); onClose() },
    })),
  ]

  const items: Item[] = query.length >= 2
    ? [
        ...navActions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase())),
        ...tasks
          .filter((t) => !t.done && t.text.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 5)
          .map((t) => ({
            kind: 'task' as const,
            id: t.id,
            text: t.text,
            fn: () => {
              const proj = t.projects[0]
              if (proj) { setActiveProject(proj); setView('focus') }
              onClose()
            },
          })),
        ...notes
          .filter((n) =>
            n.title.toLowerCase().includes(query.toLowerCase()) ||
            n.content.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 3)
          .map((n) => ({
            kind: 'note' as const,
            id: n.id,
            title: n.title,
            fn: () => { selectNote(n.id); setView('notes'); onClose() },
          })),
      ]
    : navActions

  useEffect(() => { setSelected(0) }, [query])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, items.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && items[selected]) items[selected].fn()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-[#e0e0de]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 border-b border-[#f0f0ee]">
          <svg className="w-4 h-4 text-[#aaa] shrink-0" fill="none" viewBox="0 0 16 16">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="pesquisar ou navegar…"
            className="flex-1 px-3 py-3.5 text-[13.5px] text-[#1a1a1a] placeholder:text-[#bbb] outline-none bg-transparent"
          />
        </div>

        <div className="max-h-72 overflow-y-auto py-1">
          {items.length === 0 && (
            <p className="px-4 py-3 text-[13px] text-[#bbb]">Sem resultados.</p>
          )}
          {items.map((item, i) => (
            <button
              key={item.kind === 'action' ? item.label : `${item.kind}-${item.id}`}
              onMouseEnter={() => setSelected(i)}
              onClick={item.fn}
              className={`w-full text-left flex items-center gap-3 px-4 py-2.5 text-[13px] ${
                i === selected ? 'bg-[#f7f7f5] text-[#1a1a1a]' : 'text-[#4a4a4a]'
              }`}
            >
              {item.kind === 'task' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#d0d0ce] shrink-0 mt-0.5" />
              )}
              {item.kind === 'note' && (
                <svg className="w-3 h-3 text-[#bbb] shrink-0" fill="none" viewBox="0 0 12 12">
                  <rect x="1.5" y="1.5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <line x1="3.5" y1="4" x2="8.5" y2="4" stroke="currentColor" strokeWidth="1" />
                  <line x1="3.5" y1="6" x2="8.5" y2="6" stroke="currentColor" strokeWidth="1" />
                </svg>
              )}
              <span className="flex-1 truncate">
                {item.kind === 'action' ? item.label : item.kind === 'task' ? item.text : item.title}
              </span>
              {item.kind === 'action' && item.hint && (
                <span className="text-[11px] text-[#bbb]">{item.hint}</span>
              )}
              {item.kind === 'task' && (
                <span className="text-[10px] text-[#bbb]">tarefa</span>
              )}
              {item.kind === 'note' && (
                <span className="text-[10px] text-[#bbb]">nota</span>
              )}
            </button>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-[#f0f0ee] flex gap-3 text-[11px] text-[#bbb]">
          <span>↑↓ navegar</span>
          <span>↵ executar</span>
          <span>esc fechar</span>
        </div>
      </div>
    </div>
  )
}
