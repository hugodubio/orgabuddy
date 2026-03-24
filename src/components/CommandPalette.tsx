import { useState, useEffect, useRef } from 'react'
import { useTasksStore } from '../store/tasks'
import type { Project, View } from '../types'

interface Props {
  onClose: () => void
  onFocusCapture: () => void
}

type Action = {
  label: string
  hint?: string
  fn: () => void
}

const PROJECTS: { id: Project; label: string }[] = [
  { id: 'arroz', label: 'Arroz' },
  { id: 'mystic', label: 'Mystic Fyah' },
  { id: 'estudio', label: 'Estúdio' },
  { id: 'subciety', label: 'Subciety' },
  { id: 'vida', label: 'Vida' },
]

export default function CommandPalette({ onClose, onFocusCapture }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const { setActiveProject, setOnlyUrgent, setView } = useTasksStore()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const go = (view: View, project?: Project, urgent?: boolean) => {
    if (project) setActiveProject(project)
    if (urgent) setOnlyUrgent(true)
    setView(view)
    onClose()
  }

  const allActions: Action[] = [
    { label: 'Nova tarefa', hint: '↵', fn: () => { onClose(); onFocusCapture() } },
    { label: 'Foco do dia', fn: () => go('focus') },
    { label: 'Só urgentes', fn: () => { setOnlyUrgent(true); setView('focus'); onClose() } },
    { label: 'Ver grafo', fn: () => go('graph') },
    { label: 'Nota do dia', fn: () => go('note') },
    ...PROJECTS.map(({ id, label }) => ({
      label: `Projeto: ${label}`,
      fn: () => { setActiveProject(id); setView('focus'); onClose() },
    })),
  ]

  const filtered = query
    ? allActions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
    : allActions

  useEffect(() => { setSelected(0) }, [query])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && filtered[selected]) filtered[selected].fn()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
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
            placeholder="o que queres fazer?"
            className="flex-1 px-3 py-3.5 text-[13.5px] text-[#1a1a1a] placeholder:text-[#bbb] outline-none bg-transparent"
          />
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <p className="px-4 py-3 text-[13px] text-[#bbb]">Sem resultados.</p>
          )}
          {filtered.map((action, i) => (
            <button
              key={action.label}
              onMouseEnter={() => setSelected(i)}
              onClick={action.fn}
              className={`w-full text-left flex items-center justify-between px-4 py-2.5 text-[13px] ${
                i === selected ? 'bg-[#f7f7f5] text-[#1a1a1a]' : 'text-[#4a4a4a]'
              }`}
            >
              <span>{action.label}</span>
              {action.hint && <span className="text-[11px] text-[#bbb]">{action.hint}</span>}
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
