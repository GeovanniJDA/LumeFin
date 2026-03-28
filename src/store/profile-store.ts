import { create } from 'zustand'
import type { Profile } from '@/types'
import { supabase, handleSupabaseError } from '@/lib/supabase'

interface ProfileStore {
  profile: Profile | null
  loading: boolean
  fetch: (userId: string) => Promise<void>
  update: (userId: string, data: Partial<Profile>) => Promise<void>
  reset: () => void
}

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: null,
  loading: false,

  fetch: async (userId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      if (handleSupabaseError(error)) return;
    }
    set({ profile: data, loading: false })
  },

  update: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()
      
    if (error) {
      if (handleSupabaseError(error)) return;
      throw new Error(error.message)
    }
    set({ profile: data })
  },

  reset: () => set({ profile: null, loading: false })
}))
