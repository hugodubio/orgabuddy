import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { ObNote } from '../types'
import { useAuthStore } from './auth'

const getUserId = () => useAuthStore.getState().userId ?? 'hugo'

interface NotesState {
  notes: ObNote[]
  selectedId: number | null
  fetchNotes: () => Promise<void>
  createNote: () => Promise<ObNote | null>
  updateNote: (id: number, title: string, content: string, projects?: string[]) => Promise<void>
  deleteNote: (id: number) => Promise<void>
  selectNote: (id: number | null) => void
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  selectedId: null,

  fetchNotes: async () => {
    const { data } = await supabase
      .from('ob_notes')
      .select('*')
      .eq('user_id', getUserId())
      .order('updated_at', { ascending: false })
    set({ notes: (data ?? []) as ObNote[] })
  },

  createNote: async () => {
    const { data } = await supabase
      .from('ob_notes')
      .insert({ title: 'Sem título', content: '', user_id: getUserId() })
      .select()
      .single()
    if (data) {
      set((s) => ({ notes: [data as ObNote, ...s.notes], selectedId: data.id }))
      return data as ObNote
    }
    return null
  },

  updateNote: async (id, title, content, projects) => {
    const payload: Record<string, unknown> = { title, content, updated_at: new Date().toISOString() }
    if (projects !== undefined) payload.projects = projects
    await supabase.from('ob_notes').update(payload).eq('id', id)
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, title, content, ...(projects !== undefined ? { projects } : {}) } : n)),
    }))
  },

  deleteNote: async (id) => {
    const { error } = await supabase.from('ob_notes').delete().eq('id', id)
    if (!error) {
      set((s) => ({
        notes: s.notes.filter((n) => n.id !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
      }))
    }
  },

  selectNote: (id) => set({ selectedId: id }),
}))
