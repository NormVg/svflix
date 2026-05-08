<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useNotesStore } from '../stores/notes'
import { useAuthStore } from '../stores/auth'
import { useMediaStore } from '../stores/media'

const notesStore = useNotesStore()
const authStore = useAuthStore()
const mediaStore = useMediaStore()

const { notes, loading } = storeToRefs(notesStore)
const { mediaItems } = storeToRefs(mediaStore)

await notesStore.fetchNotes()

// Composer state
const isComposerOpen = ref(false)
const noteBody = ref('')
const taggedMediaId = ref<string | null>(null)
const mediaSearch = ref('')
const isSending = ref(false)

const taggedMediaItem = computed(() => {
  if (!taggedMediaId.value) return null
  return mediaItems.value.find(m => m.id === taggedMediaId.value) || null
})

const filteredMedia = computed(() => {
  if (!mediaSearch.value.trim()) return mediaItems.value.slice(0, 20)
  const q = mediaSearch.value.toLowerCase()
  return mediaItems.value.filter(m => 
    m.title?.toLowerCase().includes(q) || 
    new Date(m.createdAt).toLocaleDateString().includes(q)
  ).slice(0, 20)
})

const openComposer = () => {
  isComposerOpen.value = true
  noteBody.value = ''
  taggedMediaId.value = null
  mediaSearch.value = ''
}

const closeComposer = () => {
  isComposerOpen.value = false
}

const sendNote = async () => {
  if (!noteBody.value.trim()) return
  isSending.value = true
  await notesStore.sendNote(noteBody.value, taggedMediaId.value)
  isSending.value = false
  closeComposer()
}
</script>

<template>
  <div class="notes-page">
    <!-- Page Header -->
    <div class="notes-header">
      <div class="header-text">
        <h1>Love Notes</h1>
        <p>Messages between just the two of you. 💌</p>
      </div>
      <button class="compose-btn" @click="openComposer">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        Write a Note
      </button>
    </div>

    <!-- Notes List -->
    <div class="notes-list" v-if="notes.length > 0">
      <TransitionGroup name="note-list" tag="div" class="notes-inner">
        <NoteCard v-for="note in notes" :key="note.id" :note="note" />
      </TransitionGroup>
    </div>
    <div v-else-if="!loading" class="empty-state">
      <div class="empty-icon">💌</div>
      <h2>No notes yet</h2>
      <p>Be the first to write something sweet.</p>
      <button class="compose-btn" @click="openComposer">Write the First Note</button>
    </div>

    <!-- Composer Bottom Sheet -->
    <Transition name="sheet">
      <div class="composer-overlay" v-if="isComposerOpen" @click.self="closeComposer">
        <div class="composer-sheet">
          <div class="sheet-handle"></div>
          <h2 class="composer-title">New Note</h2>
          
          <textarea 
            v-model="noteBody"
            class="note-textarea"
            placeholder="Write something from the heart..."
            rows="5"
            autofocus
          ></textarea>

          <!-- Media Tag Section -->
          <div class="media-tag-section">
            <div v-if="taggedMediaItem" class="tagged-preview">
              <img v-if="taggedMediaItem.mediaType === 'image'" :src="mediaStore.getMediaUrl(taggedMediaItem.bucketKey)" class="tagged-thumb" />
              <video v-else :src="mediaStore.getMediaUrl(taggedMediaItem.bucketKey) + '#t=1.0'" preload="metadata" muted class="tagged-thumb"></video>
              <div class="tagged-info">
                <span>{{ taggedMediaItem.title || 'Tagged Memory' }}</span>
                <button class="remove-tag" @click="taggedMediaId = null">✕</button>
              </div>
            </div>

            <div v-else class="media-picker">
              <input 
                v-model="mediaSearch" 
                placeholder="🔍 Search and tag a memory..." 
                class="media-search-input"
              />
              <div class="media-picker-grid" v-if="mediaSearch || filteredMedia.length">
                <div 
                  v-for="m in filteredMedia" 
                  :key="m.id" 
                  class="picker-item"
                  @click="taggedMediaId = m.id; mediaSearch = ''"
                >
                  <img v-if="m.mediaType === 'image'" :src="mediaStore.getMediaUrl(m.bucketKey)" class="picker-thumb" />
                  <video v-else :src="mediaStore.getMediaUrl(m.bucketKey) + '#t=1.0'" preload="metadata" muted class="picker-thumb"></video>
                </div>
              </div>
            </div>
          </div>

          <div class="composer-actions">
            <button class="cancel-btn" @click="closeComposer">Cancel</button>
            <button 
              class="send-btn" 
              @click="sendNote" 
              :disabled="isSending || !noteBody.trim()"
            >
              <div v-if="isSending" class="btn-spinner"></div>
              <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              {{ isSending ? 'Sending...' : 'Send' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.notes-page {
  min-height: 100vh;
  padding: 100px 4% 120px;
  max-width: 800px;
  margin: 0 auto;
  background: #141414;
}

/* Header */
.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-text h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 6px;
  color: #fff;
}
.header-text p {
  color: #777;
  font-size: 1rem;
  margin: 0;
}

.compose-btn {
  background: #e50914;
  color: #fff;
  border: none;
  padding: 12px 22px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s, transform 0.2s;
}
.compose-btn svg { width: 18px; height: 18px; }
.compose-btn:hover { background: #f40612; transform: translateY(-1px); }

/* Notes list */
.notes-inner {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 100px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.empty-icon {
  font-size: 4rem;
  line-height: 1;
}
.empty-state h2 {
  color: #fff;
  font-size: 1.5rem;
  margin: 0;
}
.empty-state p {
  color: #777;
  margin: 0;
}

/* Composer Overlay */
.composer-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.75);
  z-index: 500;
  display: flex;
  align-items: flex-end;
  backdrop-filter: blur(4px);
}

.composer-sheet {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-bottom: none;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 16px 24px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 -10px 40px rgba(0,0,0,0.8);
}

.sheet-handle {
  width: 40px;
  height: 4px;
  background: #444;
  border-radius: 2px;
  margin: 0 auto 8px;
}

.composer-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.note-textarea {
  background: #111;
  border: 1px solid #333;
  color: #fff;
  padding: 14px;
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'Georgia', serif;
  font-style: italic;
  resize: vertical;
  min-height: 120px;
  line-height: 1.7;
  transition: border-color 0.2s;
}
.note-textarea:focus { outline: none; border-color: #e50914; }
.note-textarea::placeholder { color: #555; font-style: italic; }

/* Media tag */
.media-tag-section { 
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tagged-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #111;
  border: 1px solid #333;
  border-radius: 8px;
  overflow: hidden;
}
.tagged-thumb {
  width: 64px;
  height: 48px;
  object-fit: cover;
  display: block;
  flex-shrink: 0;
}
.tagged-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  padding: 0 12px 0 0;
  color: #ccc;
  font-size: 0.9rem;
}
.remove-tag {
  background: none;
  border: none;
  color: #777;
  cursor: pointer;
  font-size: 1rem;
  padding: 4px;
  transition: color 0.2s;
}
.remove-tag:hover { color: #e50914; }

.media-search-input {
  background: #111;
  border: 1px solid #333;
  color: #fff;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.9rem;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.media-search-input:focus { outline: none; border-color: #e50914; }

.media-picker-grid {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.media-picker-grid::-webkit-scrollbar { height: 3px; }
.media-picker-grid::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }

.picker-item {
  flex: 0 0 80px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s, transform 0.2s;
}
.picker-item:hover {
  border-color: #e50914;
  transform: scale(1.05);
}
.picker-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Actions */
.composer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn {
  background: transparent;
  border: 1px solid #444;
  color: #ccc;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
}
.cancel-btn:hover { background: #222; }

.send-btn {
  background: #e50914;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}
.send-btn svg { width: 16px; height: 16px; }
.send-btn:hover:not(:disabled) { background: #f40612; }
.send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Animations */
.sheet-enter-active, .sheet-leave-active {
  transition: opacity 0.3s ease;
}
.sheet-enter-active .composer-sheet,
.sheet-leave-active .composer-sheet {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.sheet-enter-from, .sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from .composer-sheet,
.sheet-leave-to .composer-sheet {
  transform: translateY(100%);
}

.note-list-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.note-list-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
