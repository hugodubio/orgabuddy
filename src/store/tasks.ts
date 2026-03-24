import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Task, Project, View } from '../types'

const PRIORITY_ORDER: Record<string, number> = { alta: 0, média: 1, baixa: 2 }

interface TasksState {
  tasks: Task[]
  loading: boolean
  syncing: boolean
  activeProject: Project | null
  activeTag: string | null
  onlyUrgent: boolean
  view: View
  setActiveProject: (p: Project | null) => void
  setActiveTag: (tag: string | null) => void
  setOnlyUrgent: (v: boolean) => void
  setView: (v: View) => void
  fetchTasks: () => Promise<void>
  addTask: (task: Task) => void
  toggleDone: (id: number) => Promise<void>
  deleteTask: (id: number) => Promise<void>
  updateLinks: (id: number, links: number[]) => Promise<void>
  updateExternalLinks: (id: number, links: string[]) => Promise<void>
  updateTags: (id: number, tags: string[]) => Promise<void>
  syncFromMystic: () => Promise<{ added: number; updated: number }>
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  loading: false,
  syncing: false,
  activeProject: null,
  activeTag: null,
  onlyUrgent: false,
  view: 'focus',

  setActiveProject: (p) => set({ activeProject: p, activeTag: null, view: 'focus' }),
  setActiveTag: (tag) => set({ activeTag: tag, activeProject: null, onlyUrgent: false, view: 'focus' }),
  setOnlyUrgent: (v) => set({ onlyUrgent: v, activeTag: null, view: 'focus' }),
  setView: (v) => set({ view: v }),

  fetchTasks: async () => {
    set({ loading: true })
    const yesterday = new Date(Date.now() - 86400000).toISOString()
    const { data } = await supabase
      .from('ob_tasks')
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
      .from('ob_tasks')
      .update({ done: !task.done, updated_at: new Date().toISOString() })
      .eq('id', id)
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }))
  },

  deleteTask: async (id) => {
    await supabase.from('ob_tasks').delete().eq('id', id)
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
  },

  updateLinks: async (id, links) => {
    await supabase
      .from('ob_tasks')
      .update({ links, updated_at: new Date().toISOString() })
      .eq('id', id)
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, links } : t)),
    }))
  },

  updateExternalLinks: async (id, external_links) => {
    await supabase
      .from('ob_tasks')
      .update({ external_links, updated_at: new Date().toISOString() })
      .eq('id', id)
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, external_links } : t)),
    }))
  },

  updateTags: async (id, tags) => {
    await supabase
      .from('ob_tasks')
      .update({ tags, updated_at: new Date().toISOString() })
      .eq('id', id)
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, tags } : t)),
    }))
  },

  syncFromMystic: async () => {
    set({ syncing: true })
    let added = 0
    let updated = 0

    try {
      // Buscar eventos do Mystic Fyah
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .order('data')

      // Buscar tarefas do Dubio
      const { data: mfTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('membro', 'Dubio')

      const toUpsert = []

      // Mapear eventos → ob_tasks
      for (const ev of events ?? []) {
        const priority = ev.estado === 'Confirmado' ? 'alta' : 'média'
        toUpsert.push({
          text: `🎵 ${ev.nome}${ev.local ? ` — ${ev.local}` : ''}`,
          projects: ['mystic'],
          priority,
          reason: `${ev.estado}${ev.data ? ` · ${ev.data}` : ''}${ev.hora ? ` às ${ev.hora}` : ''}`,
          type: 'tarefa',
          source: 'mystic_event',
          source_id: `mf_event_${ev.id}`,
          done: ev.estado === 'Cancelado',
          links: [],
          updated_at: new Date().toISOString(),
        })
      }

      // Mapear tarefas do Dubio → ob_tasks
      for (const t of mfTasks ?? []) {
        const priority = t.prio === 'Urgente' ? 'alta' : t.prio === 'Baixa' ? 'baixa' : 'média'
        toUpsert.push({
          text: t.descricao,
          projects: ['mystic'],
          priority,
          reason: t.grupo ?? null,
          type: 'tarefa',
          source: 'mystic_task',
          source_id: `mf_task_${t.id}`,
          done: t.done ?? false,
          links: [],
          updated_at: new Date().toISOString(),
        })
      }

      if (toUpsert.length > 0) {
        const { data: upserted, error } = await supabase
          .from('ob_tasks')
          .upsert(toUpsert, { onConflict: 'source_id', ignoreDuplicates: false })
          .select()

        if (!error && upserted) {
          added = upserted.length
        }
      }

      // Recarregar tarefas
      await get().fetchTasks()
    } finally {
      set({ syncing: false })
    }

    return { added, updated }
  },
}))
