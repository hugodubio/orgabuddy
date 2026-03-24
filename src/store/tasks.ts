import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Task, Project, View } from '../types'

const PRIORITY_ORDER: Record<string, number> = { alta: 0, média: 1, baixa: 2 }

interface TasksState {
  tasks: Task[]
  loading: boolean
  activeProject: Project | null
  onlyUrgent: boolean
  view: View
  setActiveProject: (p: Project | null) => void
  setOnlyUrgent: (v: boolean) => void
  setView: (v: View) => void
  fetchTasks: () => Promise<void>
  addTask: (task: Task) => void
  toggleDone: (id: number) => Promise<void>
  deleteTask: (id: number) => Promise<void>
  updateLinks: (id: number, links: number[]) => Promise<void>
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  loading: false,
  activeProject: null,
  onlyUrgent: false,
  view: 'focus',

  setActiveProject: (p) => set({ activeProject: p, view: 'focus' }),
  setOnlyUrgent: (v) => set({ onlyUrgent: v, view: 'focus' }),
  setView: (v) => set({ view: v }),

  fetchTasks: async () => {
    set({ loading: true })
    const yesterday = new Date(Date.now() - 86400000).toISOString()
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .or(`done.eq.false,updated_at.gt.${yesterday}`)

    const sorted = (data ?? []).sort(
      (a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
    )
    set({ tasks: sorted as Task[], loading: false })
  },

  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),

  toggleDone: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    await supabase
      .from('tasks')
      .update({ done: !task.done, updated_at: new Date().toISOString() })
      .eq('id', id)
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }))
  },

  deleteTask: async (id) => {
    await supabase.from('tasks').delete().eq('id', id)
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
  },

  updateLinks: async (id, links) => {
    await supabase
      .from('tasks')
      .update({ links, updated_at: new Date().toISOString() })
      .eq('id', id)
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, links } : t)),
    }))
  },
}))
