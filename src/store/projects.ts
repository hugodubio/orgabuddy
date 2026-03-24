import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { ProjectDef } from '../types'

interface ProjectsState {
  projects: ProjectDef[]
  fetchProjects: () => Promise<void>
  addProject: (label: string) => Promise<void>
  deleteProject: (id: string) => Promise<void>
}

const PALETTES = [
  { color_bg: '#fef9c3', color_text: '#854d0e', dot_color: '#eab308' },
  { color_bg: '#dcfce7', color_text: '#166534', dot_color: '#22c55e' },
  { color_bg: '#fee2e2', color_text: '#991b1b', dot_color: '#ef4444' },
  { color_bg: '#e0f2fe', color_text: '#075985', dot_color: '#0ea5e9' },
  { color_bg: '#f3e8ff', color_text: '#6b21a8', dot_color: '#a855f7' },
  { color_bg: '#fff7ed', color_text: '#9a3412', dot_color: '#f97316' },
  { color_bg: '#f0fdf4', color_text: '#14532d', dot_color: '#16a34a' },
]

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],

  fetchProjects: async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at')
    set({ projects: (data ?? []) as ProjectDef[] })
  },

  addProject: async (label: string) => {
    const id = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_')
    const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)]
    const { data } = await supabase
      .from('projects')
      .insert({ id, label, ...palette })
      .select()
      .single()
    if (data) set((s) => ({ projects: [...s.projects, data as ProjectDef] }))
  },

  deleteProject: async (id: string) => {
    await supabase.from('projects').delete().eq('id', id)
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }))
  },
}))
