import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { ObNote } from '../types'

interface NotesState {
  notes: ObNote[]
  selectedId: number | null
  fetchNotes: () => Promise<void>
  createNote: () => Promise<ObNote | null>
  updateNote: (id: number, title: string, content: string) => Promise<void>
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
      .order('updated_at', { ascending: false })
    set({ notes: (data ?? []) as ObNote[] })
  },

  createNote: async () => {
    const { data } = await supabase
      .from('ob_notes')
      .insert({ title: 'Sem título', content: '' })
      .select()
      .single()
    if (data) {
      set((s) => ({ notes: [data as ObNote, ...s.notes], selectedId: data.id }))
      return data as ObNote
    }
    return null
  },

  updateNote: async (id, title, content) => {
    await supabase
      .from('ob_notes')
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq('id', id)
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, title, content } : n)),
    }))
  },

  deleteNote: async (id) => {
    await supabase.from('ob_notes').delete().eq('id', id)
    set((s) => ({
      notes: s.notes.filter((n) => n.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }))
  },

  selectNote: (id) => set({ selectedId: id }),
}))
