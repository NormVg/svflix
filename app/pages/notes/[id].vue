<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useNotesStore } from '../../stores/notes'
import { useAuthStore } from '../../stores/auth'
import { useMediaStore } from '../../stores/media'

const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()
const authStore = useAuthStore()
const mediaStore = useMediaStore()

const { notes } = storeToRefs(notesStore)

if (!notes.value.length) {
  await notesStore.fetchNotes()
}

const note = computed(() => notes.value.find(n => n.id === route.params.id))

onMounted(async () => {
  if (note.value) {
    await notesStore.markRead(note.value.id)
  }
})

const isMine = computed(() => note.value?.authorId === authStore.currentUser?.id)

const formattedDate = computed(() => {
  if (!note.value) return ''
  const d = new Date(note.value.createdAt)
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
})

// Letter unfold animation state
const isUnfolded = ref(false)
onMounted(() => {
  // Slight delay for the page transition to settle before unfolding
  setTimeout(() => { isUnfolded.value = true }, 100)
})
</script>

<template>
  <div class="read-page">
    <div v-if="note" class="letter-stage">
      <!-- Back button -->
      <button class="back-btn" @click="router.push('/notes')">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        Back to Notes
      </button>

      <!-- The Letter -->
      <div class="letter-wrap" :class="{ 'is-unfolded': isUnfolded }">
        <!-- Letter top fold -->
        <div class="letter-fold-top" :class="isMine ? 'fold-mine' : 'fold-theirs'">
          <div class="fold-triangle"></div>
        </div>

        <!-- Letter body -->
        <div class="letter-body">
          <!-- Author / date header -->
          <div class="letter-header">
            <div class="letter-from">
              <div class="author-dot-large" :class="isMine ? 'dot-mine' : 'dot-theirs'"></div>
              <div>
                <div class="from-label">From</div>
                <div class="from-name">{{ note.authorDisplayName || note.authorUsername }}</div>
              </div>
            </div>
            <div class="letter-date">{{ formattedDate }}</div>
          </div>

          <div class="letter-divider">
            <span>✦</span>
          </div>

          <!-- The note text -->
          <p class="letter-text">{{ note.body }}</p>

          <!-- Attached Memory -->
          <div v-if="note.mediaBucketKey" class="attached-media">
            <div class="media-label-top">📎 Attached Memory</div>
            <div class="media-frame">
              <img 
                v-if="note.mediaType === 'image'" 
                :src="notesStore.getMediaUrl(note.mediaBucketKey)" 
                class="media-img"
              />
              <video 
                v-else 
                :src="notesStore.getMediaUrl(note.mediaBucketKey)" 
                controls
                class="media-img"
              ></video>
              <div v-if="note.mediaTitle" class="media-caption">{{ note.mediaTitle }}</div>
            </div>
          </div>

          <!-- Signature -->
          <div class="letter-signature">
            <div class="sig-line"></div>
            <p>{{ note.authorDisplayName || note.authorUsername }} 🤍</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="not-found">
      <p>Note not found.</p>
      <button @click="router.push('/notes')">Back to Notes</button>
    </div>
  </div>
</template>

<style scoped>
.read-page {
  min-height: 100vh;
  background: radial-gradient(ellipse at top, #1f1a15 0%, #141414 60%);
  padding: 90px 20px 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.letter-stage {
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

/* Back button */
.back-btn {
  align-self: flex-start;
  background: transparent;
  border: none;
  color: #888;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: color 0.2s, transform 0.2s;
  padding: 0;
}
.back-btn svg { width: 20px; height: 20px; }
.back-btn:hover { color: #fff; transform: translateX(-4px); }

/* ── The letter unfold ── */
.letter-wrap {
  width: 100%;
  transform-origin: top center;
  transform: scaleY(0.08) translateY(-40px);
  opacity: 0;
  transition:
    transform 0.7s cubic-bezier(0.34, 1.2, 0.64, 1),
    opacity 0.4s ease;
  filter: blur(2px);
}

.letter-wrap.is-unfolded {
  transform: scaleY(1) translateY(0);
  opacity: 1;
  filter: blur(0);
}

/* Fold flap at the top (envelope seal look) */
.letter-fold-top {
  width: 100%;
  height: 28px;
  border-radius: 10px 10px 0 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.fold-theirs { background: linear-gradient(135deg, #e50914, #c0392b); }
.fold-mine   { background: linear-gradient(135deg, #2563eb, #4d90fe); }

.fold-triangle {
  width: 0;
  height: 0;
  border-left: 40px solid transparent;
  border-right: 40px solid transparent;
  border-top: 28px solid rgba(0,0,0,0.25);
}

/* Letter paper */
.letter-body {
  background: #1e1b17;
  border: 1px solid #35302a;
  border-top: none;
  border-radius: 0 0 12px 12px;
  padding: 32px 36px 36px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 4px 0 #0a0908;
}

@media (max-width: 480px) {
  .letter-body { padding: 24px 20px 28px; }
}

/* Header */
.letter-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
}

.letter-from {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-dot-large {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-mine   { background: #4d90fe; box-shadow: 0 0 8px rgba(77,144,254,0.5); }
.dot-theirs { background: #e50914; box-shadow: 0 0 8px rgba(229,9,20,0.5); }

.from-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #666;
}
.from-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #e5e5e5;
}

.letter-date {
  font-size: 0.8rem;
  color: #666;
  text-align: right;
  font-style: italic;
}

.letter-divider {
  text-align: center;
  color: #3a3530;
  font-size: 1.2rem;
  position: relative;
}
.letter-divider::before,
.letter-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: #2a2520;
}
.letter-divider::before { left: 0; }
.letter-divider::after { right: 0; }

/* The actual note text */
.letter-text {
  font-size: 1.15rem;
  color: #ccc;
  line-height: 1.85;
  font-family: 'Georgia', serif;
  font-style: italic;
  margin: 0;
  white-space: pre-wrap;
}

/* Attached media */
.attached-media {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.media-label-top {
  font-size: 0.8rem;
  color: #777;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.media-frame {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #2e2a25;
}
.media-img {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  display: block;
}
.media-caption {
  padding: 8px 12px;
  font-size: 0.82rem;
  color: #888;
  background: #111;
  font-style: italic;
}

/* Signature */
.letter-signature {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.sig-line {
  width: 60px;
  height: 1px;
  background: #3a3530;
}
.letter-signature p {
  font-size: 0.95rem;
  color: #888;
  font-family: 'Georgia', serif;
  font-style: italic;
}

/* Not found */
.not-found {
  text-align: center;
  padding: 80px 20px;
  color: #888;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}
.not-found button {
  background: #e50914;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}
</style>
