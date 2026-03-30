import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'
import type { TimeEntry } from '../types'

interface TimeState {
  entries: TimeEntry[]
  loading: boolean
  timerStart: Date | null
  timerProject: string | null
  timerDescription: string
  startTimer: (project: string | null, description: string) => void
  stopTimer: () => Promise<void>
  fetchEntries: (from?: string, to?: string) => Promise<void>
  addManual: (startedAt: string, endedAt: string, project: string | null, description: string) => Promise<void>
  deleteEntry: (id: number) => Promise<void>
}

export const useTimeStore = create<TimeState>((set, get) => ({
  entries: [],
  loading: false,
  timerStart: null,
  timerProject: null,
  timerDescription: '',

  startTimer: (project, description) => {
    set({ timerStart: new Date(), timerProject: project, timerDescription: description })
  },

  stopTimer: async () => {
    const { timerStart, timerProject, timerDescription } = get()
    if (!timerStart) return
    const endedAt = new Date()
    const duration = Math.round((endedAt.getTime() - timerStart.getTime()) / 60000)
    set({ timerStart: null, timerProject: null, timerDescription: '' })
    if (duration < 1) return // ignora sessões < 1 min
    const userId = useAuthStore.getState().userId ?? 'hugo'
    const { data } = await supabase.from('ob_time_entries').insert({
      user_id: userId,
      project_id: timerProject,
      description: timerDescription || null,
      started_at: timerStart.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_minutes: duration,
    }).select().single()
    if (data) set((s) => ({ entries: [data as TimeEntry, ...s.entries] }))
  },

  fetchEntries: async (from, to) => {
    set({ loading: true })
    const userId = useAuthStore.getState().userId ?? 'hugo'
    let q = supabase.from('ob_time_entries').select('*').eq('user_id', userId).order('started_at', { ascending: false })
    if (from) q = q.gte('started_at', from)
    if (to) q = q.lte('started_at', to)
    const { data } = await q
    set({ entries: (data ?? []) as TimeEntry[], loading: false })
  },

  addManual: async (startedAt, endedAt, project, description) => {
    const userId = useAuthStore.getState().userId ?? 'hugo'
    const duration = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000)
    if (duration < 1) return
    const { data } = await supabase.from('ob_time_entries').insert({
      user_id: userId,
      project_id: project || null,
      description: description || null,
      started_at: startedAt,
      ended_at: endedAt,
      duration_minutes: duration,
    }).select().single()
    if (data) set((s) => ({ entries: [data as TimeEntry, ...s.entries] }))
  },

  deleteEntry: async (id) => {
    await supabase.from('ob_time_entries').delete().eq('id', id)
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }))
  },
}))
