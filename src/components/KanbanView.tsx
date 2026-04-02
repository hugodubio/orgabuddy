import { useState } from 'react'
import type { Task, Priority } from '../types'
import { useTasksStore } from '../store/tasks'
import { useProjectsStore } from '../store/projects'
import { useClassify } from '../hooks/useClassify'
import { supabase } from '../lib/supabase'

const COLUMNS: { key: Priority; label: string; color: string; bg: string }[] = [
  { key: 'alta',  label: 'Urgente',            color: '#ef4444', bg: '#fef2f2' },
  { key: 'média', label: 'Esta semana',         color: '#f59e0b', bg: '#fffbeb' },
  { key: 'baixa', label: 'Quando houver tempo', color: '#94a3b8', bg: '#f8fafc' },
]

function MiniCard({ task, onDragStart }: { task: Task; onDragStart: () => void }) {
  const { toggleDone, deleteTask } = useTasksStore()
  const { projects } = useProjectsStore()
  const [hovered, setHovered] = useState(false)

  const getProject = (id: string) => projects.find((p) => p.id === id)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`bg-white border border-[#ebebea] rounded-lg p-3 mb-2 cursor-grab active:cursor-grabbing shadow-sm hover:shadow transition-shadow ${
        task.done ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={() => toggleDone(task.id)}
          className="mt-0.5 w-3.5 h-3.5 rounded border border-[#d0d0ce] shrink-0 flex items-center justify-center"
        >
          {task.done && (
            <svg className="w-2 h-2 text-[#aaa]" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
        <p className={`flex-1 text-[13px] leading-snug ${task.done ? 'line-through text-[#aaa]' : 'text-[#1a1a1a]'}`}>
          {task.text}
        </p>
        {hovered && (
          <button
            onClick={() => deleteTask(task.id)}
            className="text-[#ccc] hover:text-red-400 text-[14px] leading-none shrink-0"
          >×</button>
        )}
      </div>
      {task.projects.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.projects.map((pid) => {
            const p = getProject(pid)
            return p ? (
              <span key={pid} className="text-[10px] px-1.5 py-0.5 rounded-[3px] font-medium"
                style={{ background: p.color_bg, color: p.color_text }}>
                {p.label}
              </span>
            ) : null
          })}
          {(task.tags ?? []).map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-[3px] bg-[#eff6ff] text-[#3b82f6]">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

interface Props {
  tasks: Task[]
}

export default function KanbanView({ tasks }: Props) {
  const { addTask, fetchTasks } = useTasksStore()
  const { classify } = useClassify()
  const [dragId, setDragId] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<Priority | null>(null)
  const [addingIn, setAddingIn] = useState<Priority | null>(null)
  const [newText, setNewText] = useState('')
  const [saving, setSaving] = useState(false)

  const handleDrop = async (priority: Priority) => {
    if (dragId === null) return
    const task = tasks.find((t) => t.id === dragId)
    if (!task || task.priority === priority) return
    await supabase
      .from('ob_tasks')
      .update({ priority, updated_at: new Date().toISOString() })
      .eq('id', dragId)
    await fetchTasks()
    setDragId(null)
    setDragOver(null)
  }

  const handleAdd = async (priority: Priority) => {
    const text = newText.trim()
    if (!text || saving) return
    setSaving(true)
    try {
      const classified = await classify(text)
      if (!classified) return
      const { data, error } = await supabase
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
      if (!error && data) {
        addTask(data as Parameters<typeof addTask>[0])
      }
      setNewText('')
      setAddingIn(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {COLUMNS.map(({ key, label, color, bg }) => {
        const col = tasks.filter((t) => t.priority === key)
        const isOver = dragOver === key

        return (
          <div
            key={key}
            className="flex flex-col w-72 shrink-0"
            onDragOver={(e) => { e.preventDefault(); setDragOver(key) }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null) }}
            onDrop={() => handleDrop(key)}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-[12px] font-semibold text-[#1a1a1a]">{label}</span>
              <span className="ml-auto text-[11px] text-[#aaa]">{col.filter((t) => !t.done).length}</span>
            </div>

            {/* Drop zone */}
            <div
              className={`flex-1 rounded-xl p-2 transition-colors min-h-[120px] ${
                isOver ? 'ring-2 ring-inset' : ''
              }`}
              style={{
                background: bg,
                outlineColor: isOver ? color : undefined,
              }}
            >
              {col.map((task) => (
                <MiniCard
                  key={task.id}
                  task={task}
                  onDragStart={() => setDragId(task.id)}
                />
              ))}

              {/* Inline add */}
              {addingIn === key ? (
                <div className="bg-white border border-[#ebebea] rounded-lg p-2">
                  <textarea
                    autoFocus
                    rows={2}
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(key) }
                      if (e.key === 'Escape') { setAddingIn(null); setNewText('') }
                    }}
                    placeholder="Nova tarefa… ↵"
                    disabled={saving}
                    className="w-full text-[12px] text-[#1a1a1a] outline-none resize-none placeholder:text-[#bbb]"
                  />
                  <div className="flex gap-1.5 mt-1">
                    <button
                      onClick={() => handleAdd(key)}
                      disabled={!newText.trim() || saving}
                      className="px-2.5 py-1 text-[11px] bg-[#1a1a1a] text-white rounded disabled:opacity-40"
                    >{saving ? '…' : 'Adicionar'}</button>
                    <button
                      onClick={() => { setAddingIn(null); setNewText('') }}
                      className="px-2 py-1 text-[11px] text-[#aaa]"
                    >Cancelar</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setAddingIn(key); setNewText('') }}
                  className="w-full flex items-center gap-1.5 px-2 py-2 text-[12px] text-[#bbb] hover:text-[#666] rounded-lg hover:bg-black/5 transition-colors"
                >
                  <span>+</span> Adicionar
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
