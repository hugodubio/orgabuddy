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
        .from('tasks')
        .insert({
          text: classified.text,
          projects: classified.projects,
          priority: classified.priority,
          reason: classified.reason,
          type: classified.type,
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
          placeholder="o que tens na cabeça? · #alta @arroz"
          disabled={loading}
          className={`w-full bg-[#f0f0ee] rounded-lg px-4 py-3 text-[13.5px] text-[#1a1a1a] placeholder:text-[#aaa] outline-none border transition-all pr-40 disabled:opacity-60 ${
            error ? 'border-red-300 bg-red-50' : 'border-transparent focus:border-[#d0d0ce] focus:bg-white'
          }`}
        />
        {hint && (
          <span className="absolute right-3 text-[11px] text-[#bbb] pointer-events-none">{hint}</span>
        )}
      </div>

      {error && <p className="mt-1.5 text-[12px] text-red-400 px-1">{error}</p>}

      {linkQuery !== null && linkResults.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-[#e0e0de] rounded-lg shadow-lg overflow-hidden">
          {linkResults.map((t) => (
            <button key={t.id} onMouseDown={() => insertLink(t)}
              className="w-full text-left px-4 py-2.5 text-[13px] text-[#1a1a1a] hover:bg-[#f7f7f5] border-b border-[#f0f0ee] last:border-0">
              {t.text}
            </button>
          ))}
        </div>
      )}

      <p className="mt-2 text-[11px] text-[#bbb] px-1">
        Atalhos: <code className="bg-[#f0f0ee] px-1 rounded">@projeto</code>{' '}
        <code className="bg-[#f0f0ee] px-1 rounded">#prioridade</code>{' '}
        <code className="bg-[#f0f0ee] px-1 rounded">[[tarefa]]</code>
      </p>
    </div>
  )
}
