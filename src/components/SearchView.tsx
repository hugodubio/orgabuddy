import { useState, useMemo } from 'react'
import { useTasksStore } from '../store/tasks'
import { useNotesStore } from '../store/notes'
import { useDayLogsStore } from '../store/daylogs'
import { useProjectsStore } from '../store/projects'

type ResultType = 'tarefa' | 'ideia' | 'nota' | 'diário' | 'daylog'

interface Result {
  id: string
  type: ResultType
  title: string
  snippet: string
  projects: string[]
  date?: string
}

export default function SearchView() {
  const [query, setQuery] = useState('')
  const { tasks } = useTasksStore()
  const { notes } = useNotesStore()
  const { daylogs } = useDayLogsStore()
  const { projects } = useProjectsStore()

  const getProject = (id: string) => projects.find((p) => p.id === id)

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    const out: Result[] = []

    // Tasks
    for (const t of tasks) {
      const haystack = [t.text, t.note ?? '', ...(t.tags ?? [])].join(' ').toLowerCase()
      if (haystack.includes(q)) {
        out.push({
          id: `task-${t.id}`,
          type: t.type === 'ideia' ? 'ideia' : 'tarefa',
          title: t.text,
          snippet: t.note ? t.note.slice(0, 100) : '',
          projects: t.projects,
          date: t.updated_at,
        })
      }
    }

    // Free notes
    for (const n of notes) {
      const haystack = [n.title, n.content].join(' ').toLowerCase()
      if (haystack.includes(q)) {
        out.push({
          id: `note-${n.id}`,
          type: 'nota',
          title: n.title || 'Sem título',
          snippet: n.content.slice(0, 100),
          projects: n.projects ?? [],
          date: n.updated_at,
        })
      }
    }

    // Daylogs
    for (const d of daylogs) {
      const haystack = [
        d.note_content,
        ...d.tasks_done.map((t) => t.text),
        ...d.tasks_created.map((t) => t.text),
      ].join(' ').toLowerCase()
      if (haystack.includes(q)) {
        out.push({
          id: `daylog-${d.id}`,
          type: 'daylog',
          title: `Dia ${d.date}`,
          snippet: d.note_content.slice(0, 100),
          projects: d.projects,
          date: d.date,
        })
      }
    }

    return out
  }, [query, tasks, notes, daylogs])

  const typeLabel: Record<ResultType, string> = {
    tarefa: '✓',
    ideia: '💡',
    nota: '📝',
    diário: '📓',
    daylog: '📅',
  }

  const typeBg: Record<ResultType, { bg: string; color: string }> = {
    tarefa: { bg: '#f0fdf4', color: '#166534' },
    ideia: { bg: '#fefce8', color: '#854d0e' },
    nota: { bg: '#eff6ff', color: '#1d4ed8' },
    diário: { bg: '#f5f3ff', color: '#6b21a8' },
    daylog: { bg: '#fff7ed', color: '#9a3412' },
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="mb-6">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aaa]" fill="none" viewBox="0 0 16 16">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
            <line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar tarefas, notas, arquivo…"
            className="w-full pl-10 pr-4 py-3 text-[14px] rounded-xl outline-none"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-1)',
            }}
          />
        </div>
      </div>

      {query.trim() === '' && (
        <p className="text-center text-[13px] py-16" style={{ color: 'var(--text-3)' }}>
          Escreve para pesquisar tarefas, ideias, notas e arquivo.
        </p>
      )}

      {query.trim() !== '' && results.length === 0 && (
        <p className="text-center text-[13px] py-16" style={{ color: 'var(--text-3)' }}>
          Sem resultados para <strong>"{query}"</strong>
        </p>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] mb-3" style={{ color: 'var(--text-3)' }}>
            {results.length} resultado{results.length !== 1 ? 's' : ''}
          </p>
          {results.map((r) => (
            <div
              key={r.id}
              className="rounded-xl px-4 py-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-[3px] font-medium shrink-0 mt-0.5"
                  style={typeBg[r.type]}
                >
                  {typeLabel[r.type]} {r.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium leading-snug" style={{ color: 'var(--text-1)' }}>
                    {r.title}
                  </p>
                  {r.snippet && (
                    <p className="text-[12px] mt-0.5 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-3)' }}>
                      {r.snippet}
                    </p>
                  )}
                  {r.projects.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {r.projects.map((pid) => {
                        const p = getProject(pid)
                        return p ? (
                          <span key={pid} className="text-[10px] px-1.5 py-0.5 rounded-[3px] font-medium"
                            style={{ background: p.color_bg, color: p.color_text }}>
                            {p.label}
                          </span>
                        ) : null
                      })}
                    </div>
                  )}
                </div>
                {r.date && (
                  <span className="text-[10px] shrink-0" style={{ color: 'var(--text-3)' }}>
                    {new Date(r.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
