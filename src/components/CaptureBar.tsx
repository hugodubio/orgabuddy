import { useState, useRef, useEffect } from 'react'
import { useClassify } from '../hooks/useClassify'
import { useTasksStore } from '../store/tasks'
import { supabase } from '../lib/supabase'

export default function CaptureBar() {
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [linkQuery, setLinkQuery] = useState<string | null>(null)
  const [linkResults, setLinkResults] = useState<{ id: number; text: string }[]>([])
  const [linkStart, setLinkStart] = useState(0)
  const { classify, loading } = useClassify()
  const { addTask, fetchTasks, tasks } = useTasksStore()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const m = input.match(/\[\[([^\]]*?)$/)
    if (m) {
      const q = m[1].toLowerCase()
      setLinkQuery(q)
      setLinkStart(input.lastIndexOf('[['))
      setLinkResults(tasks.filter((t) => !t.done && t.text.toLowerCase().includes(q)).slice(0, 5))
    } else {
      setLinkQuery(null)
      setLinkResults([])
    }
  }, [input, tasks])

  const insertLink = (task: { id: number; text: string }) => {
    const before = input.slice(0, linkStart)
    const after = input.slice(linkStart + 2 + (linkQuery?.length ?? 0))
    setInput(`${before}[[${task.text}]]${after}`)
    setLinkQuery(null)
    inputRef.current?.focus()
  }

  const submit = async () => {
    const text = input.trim()
    if (!text || loading) return
    setError(null)

    const linkedIds: number[] = []
    const cleaned = text.replace(/\[\[([^\]]+)\]\]/g, (_, ref) => {
      const found = tasks.find((t) => t.text.toLowerCase() === ref.toLowerCase())
      if (found) linkedIds.push(found.id)
      return ref
    })

    setInput('')

    try {
      const classified = await classify(cleaned)
      if (!classified) {
        setError('Erro ao classificar — verifica a API key')
        setInput(text)
        return
      }

      const { data, error: err } = await supabase
        .from('ob_tasks')
        .insert({
          text: classified.text,
          projects: classified.projects,
          priority: classified.priority,
          reason: classified.reason,
          type: classified.type,
          tags: classified.tags ?? [],
          links: linkedIds,
        })
        .select()
        .single()

      if (err || !data) {
        setError('Erro ao guardar tarefa')
        setInput(text)
        return
      }

      addTask(data as Parameters<typeof addTask>[0])
      fetchTasks()
    } catch {
      setError('Sem ligação')
      setInput(text)
    }
  }

  const hint = input
    ? loading ? 'a classificar…' : '↵ capturar · [[ para ligar'
    : null

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(null) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !linkQuery) submit()
            if (e.key === 'Escape') setLinkQuery(null)
          }}
          placeholder="o que tens na cabeça?"
          disabled={loading}
          className="capture-input w-full rounded-lg px-4 py-3.5 text-[14px] outline-none transition-all pr-40 disabled:opacity-60"
          style={{
            background: error ? '#fdf0ee' : 'var(--surface)',
            border: error ? '1.5px solid var(--red)' : '1.5px solid var(--border)',
            color: 'var(--text-1)',
          }}
        />
        {hint && (
          <span className="absolute right-3 text-[11px] pointer-events-none" style={{ color: 'var(--text-3)' }}>{hint}</span>
        )}
      </div>

      {error && <p className="mt-1.5 text-[12px] text-red-400 px-1">{error}</p>}

      {linkQuery !== null && linkResults.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-xl shadow-lg overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {linkResults.map((t) => (
            <button key={t.id} onMouseDown={() => insertLink(t)}
              className="w-full text-left px-4 py-2.5 text-[13px] transition-colors"
              style={{ color: 'var(--text-1)', borderBottom: '1px solid var(--border-soft)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
              {t.text}
            </button>
          ))}
        </div>
      )}

      <p className="mt-2 text-[11px] px-1" style={{ color: 'var(--text-3)' }}>
        Atalhos:{' '}
        <code className="rounded px-1" style={{ background: 'var(--border-soft)', color: 'var(--text-2)' }}>@projeto</code>{' '}
        <code className="rounded px-1" style={{ background: 'var(--border-soft)', color: 'var(--text-2)' }}>#prioridade</code>{' '}
        <code className="rounded px-1" style={{ background: 'var(--border-soft)', color: 'var(--text-2)' }}>#tag</code>{' '}
        <code className="rounded px-1" style={{ background: 'var(--border-soft)', color: 'var(--text-2)' }}>[[tarefa]]</code>
      </p>
    </div>
  )
}
