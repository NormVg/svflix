<script setup lang="ts">
import { type LoveNote } from '../stores/notes'
import { useAuthStore } from '../stores/auth'

const props = defineProps<{ note: LoveNote }>()
const authStore = useAuthStore()

const isMine = computed(() => props.note.authorUsername === authStore.currentUser?.username)
const isUnread = computed(() => props.note.isRead === 'false' && !isMine.value)

const formattedDate = computed(() => {
  const d = new Date(props.note.createdAt)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
})

</script>

<template>
  <NuxtLink :to="`/notes/${note.id}`" class="note-card" :class="{ 'is-mine': isMine, 'is-unread': isUnread }">
    <!-- Envelope flap (decorative) -->
    <div class="envelope-flap" :class="isMine ? 'flap-mine' : 'flap-theirs'"></div>

    <div class="note-inner">
      <div class="note-top">
        <div class="author-row">
          <div class="author-dot" :class="isMine ? 'dot-mine' : 'dot-theirs'"></div>
          <span class="author-name">{{ note.authorDisplayName || note.authorUsername }}</span>
          <span v-if="isUnread" class="unread-pill">New 💌</span>
        </div>
        <span class="note-date">{{ formattedDate }}</span>
      </div>

      <div class="note-footer">
        <span v-if="note.mediaBucketKey" class="has-media">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
          Memory attached
        </span>
        <span v-else></span> <!-- spacer -->
        
        <div class="footer-right">
          <span v-if="isMine" class="read-receipt" :class="{ 'is-read': note.isRead === 'true' }">
            {{ note.isRead === 'true' ? '✓✓ Read' : '✓ Delivered' }}
          </span>
          <span class="open-hint">Open →</span>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.note-card {
  display: block;
  text-decoration: none;
  color: inherit;
  background: #1c1a17;
  border: 1px solid #2e2a25;
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s, border-color 0.2s;
  position: relative;
}

.note-card:hover {
  transform: translateY(-3px) scale(1.005);
  box-shadow: 0 8px 30px rgba(0,0,0,0.5);
  border-color: #5a4a38;
}

.note-card.is-mine {
  background: #181b1f;
  border-color: #252d36;
}
.note-card.is-mine:hover { border-color: #364050; }

.note-card.is-unread {
  border-color: rgba(229,9,20,0.5);
  box-shadow: 0 0 0 1px rgba(229,9,20,0.15), inset 0 0 40px rgba(229,9,20,0.03);
}

/* Envelope flap accent at top */
.envelope-flap {
  height: 3px;
  width: 100%;
}
.flap-theirs { background: linear-gradient(to right, #e50914, #ff6b6b); }
.flap-mine   { background: linear-gradient(to right, #4d90fe, #74b9ff); }

.note-inner {
  padding: 18px 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.note-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.author-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-mine   { background: #4d90fe; }
.dot-theirs { background: #e50914; }

.author-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #ddd;
}

.unread-pill {
  background: rgba(229,9,20,0.15);
  color: #ff6b6b;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  border: 1px solid rgba(229,9,20,0.3);
  letter-spacing: 0.3px;
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: none; }
  50% { box-shadow: 0 0 8px rgba(229,9,20,0.4); }
}

.note-date {
  font-size: 0.75rem;
  color: #666;
}



.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 4px;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.read-receipt {
  font-size: 0.7rem;
  color: #666;
  font-weight: 500;
  letter-spacing: 0.3px;
}
.read-receipt.is-read {
  color: #4d90fe; /* Blue ticks */
}

.has-media {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  color: #666;
}
.has-media svg { width: 12px; height: 12px; }

.open-hint {
  font-size: 0.75rem;
  color: #555;
  transition: color 0.2s;
}
.note-card:hover .open-hint { color: #aaa; }
</style>
