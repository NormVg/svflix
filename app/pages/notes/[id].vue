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

onMounted(() => {
  if (!notes.value.length) {
    notesStore.fetchNotes()
  }
})

const note = computed(() => notes.value.find(n => n.id === route.params.id))

onMounted(async () => {
  if (note.value) {
    await notesStore.markRead(note.value.id)
  }
})

const isMine = computed(() => note.value?.authorUsername === authStore.currentUser?.username)

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
        <!-- Envelope Top Flap -->
        <div class="envelope-top" :class="isMine ? 'env-mine' : 'env-theirs'"></div>
        
        <!-- Envelope Bottom Pocket -->
        <div class="envelope-bottom" :class="isMine ? 'env-mine' : 'env-theirs'"></div>

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

          <!-- Signature & Status -->
          <div class="letter-footer">
            <div class="read-status" v-if="isMine">
              <span v-if="note.isRead === 'true'" class="status-read">✓✓ Seen</span>
              <span v-else class="status-delivered">✓ Delivered</span>
            </div>
            <div v-else></div> <!-- spacer -->

            <div class="letter-signature">
              <div class="sig-line"></div>
              <p>{{ note.authorDisplayName || note.authorUsername }} 🤍</p>
            </div>
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
  position: relative;
  perspective: 1000px;
}

/* Envelope parts overlaying the letter */
.envelope-top {
  position: absolute;
  top: -10px; left: -10px; right: -10px;
  height: 45%;
  z-index: 10;
  border-radius: 12px 12px 0 0;
  transition: transform 0.8s cubic-bezier(0.5, 0, 0, 1), opacity 0.6s ease;
  pointer-events: none;
}
.envelope-top::after {
  content: '';
  position: absolute;
  top: 100%; left: 0; right: 0;
  height: 80px;
  clip-path: polygon(0 0, 50% 100%, 100% 0);
}

.envelope-bottom {
  position: absolute;
  bottom: -10px; left: -10px; right: -10px;
  height: 60%;
  z-index: 11;
  border-radius: 0 0 12px 12px;
  transition: transform 0.8s cubic-bezier(0.5, 0, 0, 1), opacity 0.6s ease;
  pointer-events: none;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
}
.envelope-bottom::before {
  content: '';
  position: absolute;
  bottom: 100%; left: 0; right: 0;
  height: 40px;
  clip-path: polygon(0 100%, 50% 0, 100% 100%);
}

/* Envelope Colors */
.env-theirs { background: #b80710; }
.env-theirs::before { background: #b80710; }
.env-theirs.envelope-top { background: #e50914; }
.env-theirs.envelope-top::after { background: #e50914; }

.env-mine { background: #1d4ed8; }
.env-mine::before { background: #1d4ed8; }
.env-mine.envelope-top { background: #2563eb; }
.env-mine.envelope-top::after { background: #2563eb; }

/* The opened state */
.letter-wrap.is-unfolded .envelope-top {
  transform: translateY(-60px) scale(1.02);
  opacity: 0;
}
.letter-wrap.is-unfolded .envelope-bottom {
  transform: translateY(60px) scale(1.02);
  opacity: 0;
}

/* Letter paper */
.letter-body {
  background: #fdfaf6;
  border: 1px solid #e8e3d8;
  border-radius: 12px;
  padding: 32px 36px 36px;
  opacity: 0;
  transform: scale(0.92) translateY(20px);
  transition: transform 0.8s cubic-bezier(0.34, 1.2, 0.64, 1), opacity 0.8s ease;
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 4px 0 #0a0908, inset 0 0 40px rgba(139,115,85,0.05);
  position: relative;
  overflow: hidden;
}

.letter-wrap.is-unfolded .letter-body {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* Subtle paper texture overlay */
.letter-body::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAiLz4KPHBhdGggZD0iTTAgMEwyIDJNMCAyTDIgMCIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utb3BhY2l0eT0iMC4wMiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz4KPC9zdmc+');
  pointer-events: none;
  opacity: 0.8;
}

@media (max-width: 480px) {
  .letter-body { padding: 24px 20px 28px; }
}

/* Header */
.letter-header {
  position: relative;
  z-index: 1;
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
.dot-mine   { background: #4d90fe; box-shadow: 0 0 8px rgba(77,144,254,0.4); }
.dot-theirs { background: #e50914; box-shadow: 0 0 8px rgba(229,9,20,0.4); }

.from-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #9c8e81;
}
.from-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #2c2825;
}

.letter-date {
  font-size: 0.8rem;
  color: #887b6d;
  text-align: right;
  font-style: italic;
}

.letter-divider {
  position: relative;
  z-index: 1;
  text-align: center;
  color: #b5a99c;
  font-size: 1.2rem;
}
.letter-divider::before,
.letter-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: #e8e3d8;
}
.letter-divider::before { left: 0; }
.letter-divider::after { right: 0; }

/* The actual note text */
.letter-text {
  position: relative;
  z-index: 1;
  font-size: 1.15rem;
  color: #2c2825;
  line-height: 1.85;
  font-family: 'Georgia', serif;
  font-style: italic;
  margin: 0;
  white-space: pre-wrap;
}

/* Attached media */
.attached-media {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.media-label-top {
  font-size: 0.8rem;
  color: #887b6d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.media-frame {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e8e3d8;
  background: #f4efea;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.media-img {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  display: block;
  border-radius: 4px;
}
.media-caption {
  padding: 10px 4px 4px;
  font-size: 0.85rem;
  color: #544b41;
  font-style: italic;
  text-align: center;
}

/* Footer: Signature & Status */
.letter-footer {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 20px;
}

.read-status {
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.status-delivered { color: #9c8e81; }
.status-read { color: #4d90fe; font-weight: 600; }

.letter-signature {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.sig-line {
  width: 60px;
  height: 1px;
  background: #d8cebf;
}
.letter-signature p {
  font-size: 0.95rem;
  color: #544b41;
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
