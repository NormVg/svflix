<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useNotesStore } from '../../stores/notes'
import { useMediaStore } from '../../stores/media'

const router = useRouter()
const notesStore = useNotesStore()
const mediaStore = useMediaStore()
const { mediaItems } = storeToRefs(mediaStore)
const { loading } = storeToRefs(notesStore)

const noteBody = ref('')
const taggedMediaId = ref<string | null>(null)
const mediaSearch = ref('')
const showPicker = ref(false)

const taggedMediaItem = computed(() =>
  taggedMediaId.value ? mediaItems.value.find(m => m.id === taggedMediaId.value) || null : null
)

const filteredMedia = computed(() => {
  if (!mediaSearch.value.trim()) return mediaItems.value.slice(0, 24)
  const q = mediaSearch.value.toLowerCase()
  return mediaItems.value.filter(m =>
    (m.title || '').toLowerCase().includes(q) ||
    new Date(m.createdAt).toLocaleDateString().includes(q)
  ).slice(0, 24)
})

const canSend = computed(() => noteBody.value.trim().length > 0)

const sendNote = async () => {
  if (!canSend.value) return
  await notesStore.sendNote(noteBody.value, taggedMediaId.value)
  router.push('/notes')
}

// Animate in
const isReady = ref(false)
onMounted(() => setTimeout(() => { isReady.value = true }, 80))
</script>

<template>
  <div class="write-page">
    <div class="write-stage" :class="{ 'is-ready': isReady }">
      <!-- Header -->
      <div class="write-header">
        <button class="back-btn" @click="router.push('/notes')">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        </button>
        <h1>New Note 💌</h1>
      </div>

      <!-- Paper composer -->
      <div class="paper">
        <div class="paper-lines"></div>
        <textarea
          v-model="noteBody"
          class="note-input"
          placeholder="Write something from the heart..."
          rows="10"
          autofocus
        ></textarea>
      </div>

      <!-- Tagged Media -->
      <div class="tag-section">
        <div v-if="taggedMediaItem" class="tagged-preview">
          <img v-if="taggedMediaItem.mediaType === 'image'" :src="mediaStore.getMediaUrl(taggedMediaItem.bucketKey)" class="tagged-thumb" />
          <video v-else :src="mediaStore.getMediaUrl(taggedMediaItem.bucketKey) + '#t=1.0'" preload="metadata" muted class="tagged-thumb"></video>
          <div class="tagged-info">
            <span>{{ taggedMediaItem.title || 'Tagged Memory' }}</span>
            <button class="remove-tag" @click="taggedMediaId = null">✕ Remove</button>
          </div>
        </div>

        <button v-else class="add-memory-btn" @click="showPicker = !showPicker">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
          Attach a memory
        </button>

        <!-- Media Picker -->
        <Transition name="picker">
          <div class="picker-panel" v-if="showPicker">
            <input
              v-model="mediaSearch"
              class="picker-search"
              placeholder="🔍 Search memories..."
              autofocus
            />
            <div class="picker-grid">
              <div
                v-for="m in filteredMedia"
                :key="m.id"
                class="picker-cell"
                @click="taggedMediaId = m.id; showPicker = false"
              >
                <img v-if="m.mediaType === 'image'" :src="mediaStore.getMediaUrl(m.bucketKey)" class="cell-thumb" />
                <video v-else :src="mediaStore.getMediaUrl(m.bucketKey) + '#t=1.0'" preload="metadata" muted class="cell-thumb"></video>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Send -->
      <div class="write-actions">
        <button class="cancel-btn" @click="router.push('/notes')">Discard</button>
        <button class="send-btn" :disabled="!canSend || loading" @click="sendNote">
          <div v-if="loading" class="btn-spinner"></div>
          <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          {{ loading ? 'Sending…' : 'Send Note' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.write-page {
  min-height: 100vh;
  padding: 90px 20px 80px;
  background: radial-gradient(ellipse at top, #1a1710 0%, #141414 60%);
  display: flex;
  justify-content: center;
}

.write-stage {
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.write-stage.is-ready {
  opacity: 1;
  transform: translateY(0);
}

/* Header */
.write-header {
  display: flex;
  align-items: center;
  gap: 16px;
}
.back-btn {
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s, transform 0.2s;
  display: flex;
}
.back-btn svg { width: 22px; height: 22px; }
.back-btn:hover { color: #fff; transform: translateX(-3px); }
.write-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

/* Paper */
.paper {
  position: relative;
  background: #1e1b17;
  border: 1px solid #35302a;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0,0,0,0.4), 0 2px 0 #0d0b09;
}

.paper-lines {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: repeating-linear-gradient(
    to bottom,
    transparent,
    transparent 31px,
    rgba(255,255,255,0.04) 31px,
    rgba(255,255,255,0.04) 32px
  );
  background-position: 0 47px;
  pointer-events: none;
  z-index: 0;
}

.note-input {
  position: relative;
  z-index: 1;
  width: 100%;
  background: transparent;
  border: none;
  color: #ccc;
  font-size: 1.1rem;
  font-family: 'Georgia', serif;
  font-style: italic;
  line-height: 2rem;
  padding: 20px 24px;
  resize: none;
  min-height: 240px;
  box-sizing: border-box;
}
.note-input:focus { outline: none; }
.note-input::placeholder { color: #444; font-style: italic; }

/* Tag section */
.tag-section { display: flex; flex-direction: column; gap: 12px; }

.add-memory-btn {
  background: #1e1b17;
  border: 1px dashed #3a3530;
  color: #777;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: border-color 0.2s, color 0.2s;
}
.add-memory-btn svg { width: 16px; height: 16px; }
.add-memory-btn:hover { border-color: #666; color: #ccc; }

.tagged-preview {
  display: flex;
  align-items: center;
  gap: 0;
  background: #1a1812;
  border: 1px solid #35302a;
  border-radius: 8px;
  overflow: hidden;
}
.tagged-thumb {
  width: 72px;
  height: 56px;
  object-fit: cover;
  display: block;
  flex-shrink: 0;
}
.tagged-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  padding: 0 14px;
  color: #ccc;
  font-size: 0.88rem;
}
.remove-tag {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 0.78rem;
  transition: color 0.2s;
}
.remove-tag:hover { color: #e50914; }

/* Picker panel */
.picker-panel {
  background: #1a1812;
  border: 1px solid #35302a;
  border-radius: 8px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.picker-search {
  background: #111;
  border: 1px solid #333;
  color: #fff;
  padding: 9px 14px;
  border-radius: 6px;
  font-size: 0.88rem;
  width: 100%;
  box-sizing: border-box;
}
.picker-search:focus { outline: none; border-color: #e50914; }

.picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
}
.picker-cell {
  aspect-ratio: 4/3;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.15s, transform 0.15s;
}
.picker-cell:hover { border-color: #e50914; transform: scale(1.04); }
.cell-thumb { width: 100%; height: 100%; object-fit: cover; display: block; }

/* Actions */
.write-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.cancel-btn {
  background: transparent;
  border: 1px solid #444;
  color: #999;
  padding: 11px 22px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.2s;
}
.cancel-btn:hover { background: #1e1e1e; }

.send-btn {
  background: #e50914;
  color: #fff;
  border: none;
  padding: 11px 28px;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s, transform 0.15s;
}
.send-btn svg { width: 16px; height: 16px; }
.send-btn:hover:not(:disabled) { background: #f40612; transform: translateY(-1px); }
.send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.picker-enter-active, .picker-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.picker-enter-from, .picker-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
