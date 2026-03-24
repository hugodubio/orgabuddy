import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Habit, HabitLog } from '../types'

interface HabitsState {
  habits: Habit[]
  logs: HabitLog[]
  toggling: Set<string> // "habitId-date" em processamento
  fetchHabits: () => Promise<void>
  fetchLogs: (since: string) => Promise<void>
  addHabit: (text: string, color?: string) => Promise<void>
  deleteHabit: (id: number) => Promise<void>
  toggleLog: (habitId: number, date: string) => Promise<void>
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
]

let colorIndex = 0

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  logs: [],
  toggling: new Set(),

  fetchHabits: async () => {
    const { data } = await supabase.from('ob_habits').select('*').order('created_at')
    set({ habits: (data ?? []) as Habit[] })
  },

  fetchLogs: async (since: string) => {
    const { data } = await supabase
      .from('ob_habit_logs')
      .select('*')
      .gte('date', since)
    set({ logs: (data ?? []) as HabitLog[] })
  },

  addHabit: async (text: string, color?: string) => {
    const c = color ?? COLORS[colorIndex % COLORS.length]
    colorIndex++
    const { data } = await supabase
      .from('ob_habits')
      .insert({ text, frequency: 'daily', days_of_week: [0,1,2,3,4,5,6], color: c })
      .select()
      .single()
    if (data) set((s) => ({ habits: [...s.habits, data as Habit] }))
  },

  deleteHabit: async (id: number) => {
    await supabase.from('ob_habits').delete().eq('id', id)
    set((s) => ({
      habits: s.habits.filter((h) => h.id !== id),
      logs: s.logs.filter((l) => l.habit_id !== id),
    }))
  },

  toggleLog: async (habitId: number, date: string) => {
    const key = `${habitId}-${date}`
    if (get().toggling.has(key)) return // evita race condition de duplo clique
    set((s) => ({ toggling: new Set([...s.toggling, key]) }))
    try {
      const existing = get().logs.find((l) => l.habit_id === habitId && l.date === date)
      if (existing) {
        const { error } = await supabase.from('ob_habit_logs').delete().eq('id', existing.id)
        if (!error) set((s) => ({ logs: s.logs.filter((l) => l.id !== existing.id) }))
      } else {
        const { data, error } = await supabase
          .from('ob_habit_logs')
          .insert({ habit_id: habitId, date, done: true })
          .select()
          .single()
        if (!error && data) set((s) => ({ logs: [...s.logs, data as HabitLog] }))
      }
    } finally {
      set((s) => {
        const next = new Set(s.toggling)
        next.delete(key)
        return { toggling: next }
      })
    }
  },
}))
