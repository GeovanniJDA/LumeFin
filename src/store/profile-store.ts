import { create } from 'zustand'
import type { Profile } from '@/types'
import { supabase, handleSupabaseError } from '@/lib/supabase'

const getSignedAvatarUrl = async (path: string): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from('avatars')
    .createSignedUrl(path, 3600) // valid for 1 hour
  if (error || !data) return null
  return data.signedUrl
}

interface ProfileStore {
  profile: Profile | null
  loading: boolean
  avatarStoragePath: string | null
  fetch: (userId: string) => Promise<void>
  update: (userId: string, data: Partial<Profile>) => Promise<void>
  refreshAvatarUrl: (storagePath: string) => Promise<void>
  reset: () => void
}

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: null,
  loading: false,
  avatarStoragePath: null,

  fetch: async (userId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      if (handleSupabaseError(error)) return;
      set({ loading: false });
      return;
    }

    let avatarUrl = data.avatar_url
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      avatarUrl = await getSignedAvatarUrl(avatarUrl)
    }

    set({ 
      profile: { ...data, avatar_url: avatarUrl }, 
      avatarStoragePath: data.avatar_url ?? null,
      loading: false 
    })
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

    let avatarUrl = data.avatar_url
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      avatarUrl = await getSignedAvatarUrl(avatarUrl)
    }

    set({ 
      profile: { ...data, avatar_url: avatarUrl },
      avatarStoragePath: data.avatar_url ?? null
    })
  },

  refreshAvatarUrl: async (storagePath: string) => {
    const signedUrl = await getSignedAvatarUrl(storagePath)
    if (signedUrl) {
      set(state => ({
        profile: state.profile
          ? { ...state.profile, avatar_url: signedUrl }
          : null
      }))
    }
  },

  reset: () => set({ profile: null, loading: false, avatarStoragePath: null })
}))
