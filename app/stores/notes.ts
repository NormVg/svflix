import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { useMediaStore } from './media'

export type LoveNote = {
  id: string
  body: string
  isRead: string
  createdAt: string
  authorId: string
  authorUsername: string
  authorDisplayName: string
  mediaItemId: string | null
  mediaBucketKey: string | null
  mediaType: 'image' | 'video' | null
  mediaTitle: string | null
}

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<LoveNote[]>([])
  const loading = ref(false)

  const authStore = useAuthStore()
  const mediaStore = useMediaStore()

  const unreadCount = computed(() =>
    notes.value.filter(n => n.isRead === 'false' && n.authorUsername !== authStore.currentUser?.username).length
  )

  const fetchNotes = async () => {
    loading.value = true
    try {
      notes.value = await $fetch<LoveNote[]>('/api/notes')
    } finally {
      loading.value = false
    }
  }

  const sendNote = async (body: string, mediaItemId?: string | null) => {
    loading.value = true
    try {
      await $fetch('/api/notes', {
        method: 'POST',
        body: { body, mediaItemId: mediaItemId || null }
      })
      await fetchNotes()
      return { success: true }
    } catch (e) {
      return { error: true }
    } finally {
      loading.value = false
    }
  }

  const markRead = async (id: string) => {
    const note = notes.value.find(n => n.id === id)
    if (!note || note.isRead === 'true') return
    note.isRead = 'true' // Optimistic update
    await $fetch(`/api/notes/${id}`, { method: 'PATCH' })
  }

  const getMediaUrl = (key: string) => mediaStore.getMediaUrl(key)

  return { notes, loading, unreadCount, fetchNotes, sendNote, markRead, getMediaUrl }
})
