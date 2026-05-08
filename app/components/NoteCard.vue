<script setup lang="ts">
import { type LoveNote } from '../stores/notes'
import { useNotesStore } from '../stores/notes'
import { useAuthStore } from '../stores/auth'

const props = defineProps<{ note: LoveNote }>()

const notesStore = useNotesStore()
const authStore = useAuthStore()

const isOpen = ref(false)
const isAnimating = ref(false)

const isMine = computed(() => props.note.authorId === authStore.currentUser?.id)

const toggle = async () => {
  if (isAnimating.value) return
  isAnimating.value = true
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    await notesStore.markRead(props.note.id)
  }
  setTimeout(() => { isAnimating.value = false }, 500)
}

const formattedDate = computed(() => {
  const d = new Date(props.note.createdAt)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
})

const isUnread = computed(() => props.note.isRead === 'false' && !isMine.value)
</script>

<template>
  <div 
    class="note-card" 
    :class="{ 'is-open': isOpen, 'is-mine': isMine, 'is-unread': isUnread }"
    @click="toggle"
  >
    <!-- Folded Header (always visible) -->
    <div class="note-header">
      <div class="note-header-left">
        <div class="author-dot" :class="isMine ? 'dot-mine' : 'dot-theirs'"></div>
        <span class="author-name">{{ note.authorDisplayName || note.authorUsername }}</span>
        <span v-if="isUnread" class="unread-badge">New</span>
      </div>
      <div class="note-header-right">
        <span class="note-date">{{ formattedDate }}</span>
        <svg class="chevron" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
        </svg>
      </div>
    </div>

    <!-- Crease Line (folded indicator) -->
    <div class="crease-line"></div>

    <!-- Note Body (unfolds) -->
    <div class="note-body-wrapper">
      <div class="note-body">
        <p class="note-text">{{ note.body }}</p>

        <!-- Tagged Media Preview -->
        <div v-if="note.mediaBucketKey" class="tagged-media" @click.stop>
          <img 
            v-if="note.mediaType === 'image'" 
            :src="notesStore.getMediaUrl(note.mediaBucketKey)" 
            class="media-preview"
          />
          <video 
            v-else 
            :src="notesStore.getMediaUrl(note.mediaBucketKey) + '#t=1.0'" 
            preload="metadata"
            muted
            playsinline
            class="media-preview"
          ></video>
          <div class="media-label">
            <svg v-if="note.mediaType === 'video'" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
            <span>{{ note.mediaTitle || 'Tagged Memory' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.note-card {
  border-radius: 10px;
  background: #1c1a17;
  border: 1px solid #2e2a25;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.3s, box-shadow 0.3s, transform 0.2s;
  user-select: none;
}

.note-card:hover {
  border-color: #4a3f30;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  transform: translateY(-1px);
}

.note-card.is-mine {
  background: #181a1c;
  border-color: #252a2e;
}

.note-card.is-unread {
  border-color: rgba(229, 9, 20, 0.4);
  box-shadow: 0 0 0 1px rgba(229, 9, 20, 0.15);
}

/* Header */
.note-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  gap: 12px;
}

.note-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.note-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  color: #666;
}

.author-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-mine { background: #4d90fe; }
.dot-theirs { background: #e50914; }

.author-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #ddd;
  white-space: nowrap;
}

.unread-badge {
  background: #e50914;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.note-date {
  font-size: 0.78rem;
  white-space: nowrap;
}

.chevron {
  width: 18px;
  height: 18px;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0;
}
.note-card.is-open .chevron {
  transform: rotate(180deg);
}

/* Crease line (envelope effect) */
.crease-line {
  height: 1px;
  margin: 0 16px;
  background: repeating-linear-gradient(
    to right,
    #2e2a25 0px,
    #2e2a25 8px,
    transparent 8px,
    transparent 14px
  );
  transition: opacity 0.3s;
}
.note-card.is-open .crease-line {
  background: #2e2a25;
}

/* Body — unfold animation */
.note-body-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}
.note-card.is-open .note-body-wrapper {
  grid-template-rows: 1fr;
}

.note-body {
  overflow: hidden;
}

.note-text {
  padding: 20px 20px 16px;
  color: #ccc;
  font-size: 1rem;
  line-height: 1.7;
  white-space: pre-wrap;
  margin: 0;
  font-style: italic;
  font-family: 'Georgia', serif;
}

/* Tagged Media */
.tagged-media {
  margin: 0 20px 20px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #2e2a25;
  cursor: default;
}

.media-preview {
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  display: block;
}

.media-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #111;
  color: #999;
  font-size: 0.82rem;
}
.media-label svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
</style>
