import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { DayLog } from '../types'

interface DayLogsState {
  daylogs: DayLog[]
  fetchDayLogs: () => Promise<void>
  createDayLog: (
    date: string,
    noteContent: string,
    tasksDone: DayLog['tasks_done'],
    tasksCreated: DayLog['tasks_created'],
  ) => Promise<void>
  deleteDayLog: (id: number) => Promise<void>
}

export const useDayLogsStore = create<DayLogsState>((set) => ({
  daylogs: [],

  fetchDayLogs: async () => {
    const { data } = await supabase
      .from('ob_daylogs')
      .select('*')
      .order('date', { ascending: false })
    set({ daylogs: (data ?? []) as DayLog[] })
  },

  createDayLog: async (date, noteContent, tasksDone, tasksCreated) => {
    const allProjects = Array.from(
      new Set([...tasksDone, ...tasksCreated].flatMap((t) => t.projects))
    )
    const payload = {
      date,
      note_content: noteContent,
      tasks_done: tasksDone,
      tasks_created: tasksCreated,
      projects: allProjects,
    }
    const { data } = await supabase
      .from('ob_daylogs')
      .upsert(payload, { onConflict: 'date' })
      .select()
      .single()
    if (data) {
      set((s) => ({
        daylogs: [
          data as DayLog,
          ...s.daylogs.filter((d) => d.date !== date),
        ].sort((a, b) => b.date.localeCompare(a.date)),
      }))
    }
  },

  deleteDayLog: async (id) => {
    await supabase.from('ob_daylogs').delete().eq('id', id)
    set((s) => ({ daylogs: s.daylogs.filter((d) => d.id !== id) }))
  },
}))
