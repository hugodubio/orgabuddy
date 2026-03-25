import { useState, useRef, useEffect } from 'react'
import type { Task, Priority } from '../types'
import TaskCard from './TaskCard'
import { useClassify } from '../hooks/useClassify'
import { useTasksStore } from '../store/tasks'
import { supabase } from '../lib/supabase'

const GROUPS = [
  { key: 'alta',  label: 'Urgente',             pip: 'bg-red-400' },
  { key: 'média', label: 'Esta semana',          pip: 'bg-amber-400' },
  { key: 'baixa', label: 'Quando houver tempo',  pip: 'bg-[#d0d0ce]' },
] as const

function InlineAdd({ priority, onDone }: { priority: Priority; onDone: () => void }) {
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLTextAreaElement>(null)
  const { classify } = useClassify()
  const { addTask, fetchTasks } = useTasksStore()

  useEffect(() => { ref.current?.focus() }, [])

  const submit = async () => {
    const text = value.trim()
    if (!text || saving) return
    setSaving(true)
    setError(null)
    try {
      const classified = await classify(text)
      if (!classified) { setError('Erro ao classificar'); setSaving(false); return }
      const { data, error: err } = await supabase
        .from('ob_tasks')
        .insert({
          text: classified.text,
          projects: classified.projects,
          priority,
          reason: classified.reason,
          type: classified.type,
          tags: classified.tags ?? [],
          links: [],
        })
        .select()
        .single()
      if (err || !data) {
        setError(err?.message ?? 'Erro ao guardar')
        setSaving(false)
        return
      }
      addTask(data as Parameters<typeof addTask>[0])
      fetchTasks()
      onDone()
    } catch (e) {
      setError(String(e))
      setSaving(false)
    }
  }

  return (
    <div className="mx-1 mb-1 rounded-lg border border-[#d0d0ce] bg-white shadow-sm overflow-hidden">
      <textarea
        ref={ref}
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
          if (e.key === 'Escape') onDone()
        }}
        placeholder="Nova tarefa… ↵ para guardar"
        disabled={saving}
        className="w-full px-3 py-2.5 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] outline-none resize-none disabled:opacity-50"
      />
      {error && <p className="px-3 pb-1 text-[11px] text-red-400">{error}</p>}
      <div className="flex items-center gap-2 px-3 pb-2.5">
        <button
          onClick={submit}
          disabled={saving || !value.trim()}
          className="px-3 py-1 text-[12px] bg-[#1a1a1a] text-white rounded-md disabled:opacity-40 hover:bg-[#333] transition-colors"
        >
          {saving ? '…' : 'Adicionar'}
        </button>
        <button
          onClick={onDone}
          className="px-2 py-1 text-[12px] text-[#aaa] hover:text-[#555] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

interface Props {
  tasks: Task[]
}

export default function TaskList({ tasks }: Props) {
  const [adding, setAdding] = useState<Priority | null>(null)

  if (tasks.length === 0) {
    return (
      <div className="py-16 text-center text-[13px] text-[#bbb]">
        Nada por aqui.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {GROUPS.map(({ key, label, pip }) => {
        const group = tasks.filter((t) => t.priority === key)
        return (
          <section key={key}>
            <div className="flex items-center gap-2 mb-2 px-3">
              <span className={`w-1.5 h-1.5 rounded-full ${pip}`} />
              <span className="text-[11px] uppercase tracking-widest text-[#aaa] font-medium">
                {label}
              </span>
              <span className="ml-auto text-[11px] text-[#ccc]">{group.length}</span>
            </div>
            <div>
              {group.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>

            {adding === key ? (
              <InlineAdd priority={key} onDone={() => setAdding(null)} />
            ) : (
              <button
                onClick={() => setAdding(key)}
                className="flex items-center gap-1.5 w-full px-3 py-2 text-[12px] text-[#bbb] hover:text-[#666] hover:bg-[#f7f7f5] rounded-lg transition-colors"
              >
                <span className="text-[16px] leading-none">+</span>
                Adicionar cartão
              </button>
            )}
          </section>
        )
      })}
    </div>
  )
}
