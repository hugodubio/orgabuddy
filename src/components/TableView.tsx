import { useState } from 'react'
import type { Task, Priority } from '../types'
import { useTasksStore } from '../store/tasks'
import { useProjectsStore } from '../store/projects'
import { supabase } from '../lib/supabase'

type SortKey = 'text' | 'priority' | 'created_at'
type SortDir = 'asc' | 'desc'

const PRIORITY_ORDER: Record<string, number> = { alta: 0, média: 1, baixa: 2 }
const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  alta:  { label: 'Urgente',  color: '#ef4444' },
  média: { label: 'Esta sem.', color: '#f59e0b' },
  baixa: { label: 'Baixa',    color: '#94a3b8' },
}

interface Props {
  tasks: Task[]
}

export default function TableView({ tasks }: Props) {
  const { toggleDone, deleteTask, fetchTasks } = useTasksStore()
  const { projects } = useProjectsStore()
  const [sort, setSort] = useState<SortKey>('priority')
  const [dir, setDir] = useState<SortDir>('asc')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const cancelledRef = { current: false }

  const getProject = (id: string) => projects.find((p) => p.id === id)

  const sorted = [...tasks].sort((a, b) => {
    let cmp = 0
    if (sort === 'priority') cmp = (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
    else if (sort === 'text') cmp = a.text.localeCompare(b.text)
    else if (sort === 'created_at') cmp = a.created_at.localeCompare(b.created_at)
    return dir === 'asc' ? cmp : -cmp
  })

  const toggleSort = (key: SortKey) => {
    if (sort === key) setDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSort(key); setDir('asc') }
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sort !== k) return <span className="text-[#ddd]">↕</span>
    return <span style={{ color: '#1a1a1a' }}>{dir === 'asc' ? '↑' : '↓'}</span>
  }

  const changePriority = async (id: number, priority: Priority) => {
    await supabase.from('ob_tasks').update({ priority, updated_at: new Date().toISOString() }).eq('id', id)
    await fetchTasks()
  }

  const saveEdit = async (id: number) => {
    const text = editText.trim()
    if (!text) return
    await supabase.from('ob_tasks').update({ text, updated_at: new Date().toISOString() }).eq('id', id)
    await fetchTasks()
    setEditingId(null)
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-[13px] border-collapse">
        <thead>
          <tr className="border-b border-[#ebebea]">
            <th className="w-8 py-2 px-3" />
            <th
              className="text-left py-2 px-3 font-medium text-[#aaa] cursor-pointer hover:text-[#666] select-none"
              onClick={() => toggleSort('text')}
            >
              Tarefa <SortIcon k="text" />
            </th>
            <th
              className="text-left py-2 px-3 font-medium text-[#aaa] cursor-pointer hover:text-[#666] select-none w-32"
              onClick={() => toggleSort('priority')}
            >
              Prioridade <SortIcon k="priority" />
            </th>
            <th className="text-left py-2 px-3 font-medium text-[#aaa] w-48">Projetos</th>
            <th className="text-left py-2 px-3 font-medium text-[#aaa] w-32">Tags</th>
            <th
              className="text-left py-2 px-3 font-medium text-[#aaa] cursor-pointer hover:text-[#666] select-none w-24"
              onClick={() => toggleSort('created_at')}
            >
              Data <SortIcon k="created_at" />
            </th>
            <th className="w-8 py-2 px-3" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((task) => (
            <tr
              key={task.id}
              className={`border-b border-[#f5f5f3] hover:bg-[#fafafa] transition-colors group ${task.done ? 'opacity-50' : ''}`}
            >
              {/* Checkbox */}
              <td className="py-2 px-3">
                <button
                  onClick={() => toggleDone(task.id)}
                  className="w-4 h-4 rounded border border-[#d0d0ce] flex items-center justify-center hover:border-[#aaa]"
                >
                  {task.done && (
                    <svg className="w-2.5 h-2.5 text-[#aaa]" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </td>

              {/* Text */}
              <td className="py-2 px-3">
                {editingId === task.id ? (
                  <input
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(task.id)
                      if (e.key === 'Escape') { cancelledRef.current = true; setEditingId(null) }
                    }}
                    onBlur={() => { if (!cancelledRef.current) saveEdit(task.id); cancelledRef.current = false }}
                    className="w-full outline-none border-b border-[#3b82f6] text-[13px] text-[#1a1a1a] bg-transparent"
                  />
                ) : (
                  <span
                    className={`cursor-text hover:text-[#3b82f6] transition-colors ${task.done ? 'line-through text-[#aaa]' : 'text-[#1a1a1a]'}`}
                    onDoubleClick={() => { setEditingId(task.id); setEditText(task.text) }}
                    title="Duplo clique para editar"
                  >
                    {task.text}
                  </span>
                )}
              </td>

              {/* Priority */}
              <td className="py-2 px-3">
                <select
                  value={task.priority}
                  onChange={(e) => changePriority(task.id, e.target.value as Priority)}
                  className="text-[11px] px-1.5 py-0.5 rounded-[3px] font-medium border-0 outline-none cursor-pointer bg-transparent"
                  style={{ color: PRIORITY_LABELS[task.priority]?.color }}
                >
                  <option value="alta">Urgente</option>
                  <option value="média">Esta sem.</option>
                  <option value="baixa">Baixa</option>
                </select>
              </td>

              {/* Projects */}
              <td className="py-2 px-3">
                <div className="flex flex-wrap gap-1">
                  {task.projects.map((pid) => {
                    const p = getProject(pid)
                    return p ? (
                      <span key={pid} className="text-[10px] px-1.5 py-0.5 rounded-[3px] font-medium"
                        style={{ background: p.color_bg, color: p.color_text }}>
                        {p.label}
                      </span>
                    ) : null
                  })}
                </div>
              </td>

              {/* Tags */}
              <td className="py-2 px-3">
                <div className="flex flex-wrap gap-1">
                  {(task.tags ?? []).map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-[3px] bg-[#eff6ff] text-[#3b82f6]">
                      #{tag}
                    </span>
                  ))}
                </div>
              </td>

              {/* Date */}
              <td className="py-2 px-3 text-[11px] text-[#bbb] whitespace-nowrap">
                {new Date(task.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
              </td>

              {/* Delete */}
              <td className="py-2 px-3">
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-[#ccc] hover:text-red-400 transition-all"
                >×</button>
              </td>
            </tr>
          ))}

          {sorted.length === 0 && (
            <tr>
              <td colSpan={7} className="py-12 text-center text-[13px] text-[#bbb]">
                Nenhuma tarefa.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
