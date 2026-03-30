import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import bcrypt from 'bcryptjs'
import { supabase } from '../lib/supabase'

interface AuthState {
  userId: string | null
  userName: string | null
  role: 'admin' | 'user' | null
  isAdmin: boolean
  login: (username: string, password: string) => Promise<{ error: string | null }>
  createUser: (id: string, name: string, password: string, role?: 'admin' | 'user') => Promise<{ error: string | null }>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      userName: null,
      role: null,
      isAdmin: false,

      login: async (username, password) => {
        const { data, error } = await supabase
          .from('ob_users')
          .select('id, name, password_hash, role')
          .eq('id', username.toLowerCase().trim())
          .single()

        if (error || !data) return { error: 'Utilizador não encontrado' }

        const match = await bcrypt.compare(password, data.password_hash)
        if (!match) return { error: 'Password incorreta' }

        set({ userId: data.id, userName: data.name, role: data.role, isAdmin: data.role === 'admin' })
        return { error: null }
      },

      createUser: async (id, name, password, role = 'user') => {
        const hash = await bcrypt.hash(password, 10)
        const { error } = await supabase
          .from('ob_users')
          .insert({ id: id.toLowerCase().trim(), name, password_hash: hash, role })

        if (error) return { error: error.message }
        return { error: null }
      },

      logout: () => set({ userId: null, userName: null, role: null, isAdmin: false }),
    }),
    { name: 'orgabuddy-auth' }
  )
)
