import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'
import type { CalendarEvent, RecurrenceRule } from '../types'

export interface CreateEventInput {
  title: string
  start_date: string
  end_date: string
  project_id?: string | null
  notes?: string | null
  location?: string | null
  recurrence_rule?: RecurrenceRule | null
  recurrence_end?: string | null
  create_task?: boolean
}

interface EventsState {
  events: CalendarEvent[]
  loading: boolean
  fetchEvents: (from: string, to: string) => Promise<void>
  createEvent: (input: CreateEventInput) => Promise<CalendarEvent | null>
  updateEvent: (id: number, input: Partial<CreateEventInput>) => Promise<void>
  deleteEvent: (id: number) => Promise<void>
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  loading: false,

  fetchEvents: async (from, to) => {
    set({ loading: true })
    const userId = useAuthStore.getState().userId ?? 'hugo'
    const { data } = await supabase
      .from('ob_events')
      .select('*')
      .eq('user_id', userId)
      .lte('start_date', to)
      .gte('end_date', from)
      .order('start_date', { ascending: true })
    set({ events: (data ?? []) as CalendarEvent[], loading: false })
  },

  createEvent: async (input) => {
    const userId = useAuthStore.getState().userId ?? 'hugo'
    const { data, error } = await supabase
      .from('ob_events')
      .insert({
        user_id: userId,
        title: input.title,
        start_date: input.start_date,
        end_date: input.end_date,
        project_id: input.project_id ?? null,
        notes: input.notes ?? null,
        location: input.location ?? null,
        recurrence_rule: input.recurrence_rule ?? null,
        recurrence_end: input.recurrence_end ?? null,
      })
      .select()
      .single()

    if (error || !data) return null
    const event = data as CalendarEvent

    if (input.create_task) {
      const { data: task } = await supabase
        .from('ob_tasks')
        .insert({
          user_id: userId,
          text: input.title,
          projects: input.project_id ? [input.project_id] : [],
          priority: 'média',
          type: 'tarefa',
          due_date: input.start_date,
        })
        .select('id')
        .single()
      if (task) {
        await supabase.from('ob_events').update({ task_id: task.id }).eq('id', event.id)
        event.task_id = task.id
      }
    }

    set((s) => ({ events: [...s.events, event].sort((a, b) => a.start_date.localeCompare(b.start_date)) }))
    return event
  },

  updateEvent: async (id, input) => {
    const { data } = await supabase
      .from('ob_events')
      .update({
        ...(input.title !== undefined && { title: input.title }),
        ...(input.start_date !== undefined && { start_date: input.start_date }),
        ...(input.end_date !== undefined && { end_date: input.end_date }),
        ...(input.project_id !== undefined && { project_id: input.project_id }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.location !== undefined && { location: input.location }),
        ...(input.recurrence_rule !== undefined && { recurrence_rule: input.recurrence_rule }),
        ...(input.recurrence_end !== undefined && { recurrence_end: input.recurrence_end }),
      })
      .eq('id', id)
      .select()
      .single()
    if (data) {
      set((s) => ({ events: s.events.map((e) => e.id === id ? (data as CalendarEvent) : e) }))
    }
  },

  deleteEvent: async (id) => {
    const { events } = get()
    const event = events.find((e) => e.id === id)
    await supabase.from('ob_events').delete().eq('id', id)
    if (event?.parent_event_id === null && event?.recurrence_rule) {
      // apaga todas as instâncias desta recorrência
      await supabase.from('ob_events').delete().eq('parent_event_id', id)
    }
    set((s) => ({ events: s.events.filter((e) => e.id !== id && e.parent_event_id !== id) }))
  },
}))
