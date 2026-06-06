import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'
import type { Track, Release, TrackStatus } from '../types'

interface TracksState {
  tracks: Track[]
  releases: Release[]
  loading: boolean
  fetchTracks: () => Promise<void>
  addTrack: (fields: Partial<Track>) => Promise<Track | null>
  updateTrack: (id: number, fields: Partial<Track>) => Promise<void>
  deleteTrack: (id: number) => Promise<void>
  fetchReleases: () => Promise<void>
  addRelease: (fields: Partial<Release>) => Promise<Release | null>
  updateRelease: (id: number, fields: Partial<Release>) => Promise<void>
  deleteRelease: (id: number) => Promise<void>
}

const getUserId = () => useAuthStore.getState().userId ?? 'hugo'

export const useTracksStore = create<TracksState>((set, get) => ({
  tracks: [],
  releases: [],
  loading: false,

  fetchTracks: async () => {
    set({ loading: true })
    const userId = getUserId()
    const { data } = await supabase
      .from('ob_tracks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    set({ tracks: (data ?? []) as Track[], loading: false })
  },

  addTrack: async (fields) => {
    const userId = getUserId()
    const { data, error } = await supabase
      .from('ob_tracks')
      .insert({ user_id: userId, status: 'ideia', ...fields })
      .select()
      .single()
    if (error || !data) return null
    const track = data as Track
    set((s) => ({ tracks: [track, ...s.tracks] }))
    return track
  },

  updateTrack: async (id, fields) => {
    await supabase
      .from('ob_tracks')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
    set((s) => ({
      tracks: s.tracks.map((t) => t.id === id ? { ...t, ...fields } : t)
    }))
  },

  deleteTrack: async (id) => {
    await supabase.from('ob_tracks').delete().eq('id', id)
    set((s) => ({ tracks: s.tracks.filter((t) => t.id !== id) }))
    // remove from releases
    set((s) => ({
      releases: s.releases.map((r) => ({
        ...r,
        track_ids: r.track_ids.filter((tid) => tid !== id),
      }))
    }))
  },

  fetchReleases: async () => {
    const userId = getUserId()
    const { data } = await supabase
      .from('ob_releases')
      .select('*')
      .eq('user_id', userId)
      .order('release_date', { ascending: true })
    set({ releases: (data ?? []) as Release[] })
  },

  addRelease: async (fields) => {
    const userId = getUserId()
    const { data, error } = await supabase
      .from('ob_releases')
      .insert({ user_id: userId, type: 'single', track_ids: [], ...fields })
      .select()
      .single()
    if (error || !data) return null
    const release = data as Release
    set((s) => ({ releases: [...s.releases, release] }))
    return release
  },

  updateRelease: async (id, fields) => {
    await supabase
      .from('ob_releases')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
    set((s) => ({
      releases: s.releases.map((r) => r.id === id ? { ...r, ...fields } : r)
    }))
  },

  deleteRelease: async (id) => {
    await supabase.from('ob_releases').delete().eq('id', id)
    set((s) => ({ releases: s.releases.filter((r) => r.id !== id) }))
  },
}))
