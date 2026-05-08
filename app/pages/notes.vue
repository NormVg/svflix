<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useNotesStore } from '../stores/notes'

const router = useRouter()
const notesStore = useNotesStore()
const { notes, loading } = storeToRefs(notesStore)

await notesStore.fetchNotes()
</script>

<template>
  <div class="notes-page">
    <div class="notes-header">
      <div class="header-text">
        <h1>Love Notes</h1>
        <p>Messages between just the two of you.</p>
      </div>
      <NuxtLink to="/notes/write" class="compose-btn">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        Write a Note
      </NuxtLink>
    </div>

    <TransitionGroup name="note-list" tag="div" class="notes-list" v-if="notes.length > 0">
      <NoteCard v-for="note in notes" :key="note.id" :note="note" />
    </TransitionGroup>

    <div v-else-if="!loading" class="empty-state">
      <div class="empty-icon">💌</div>
      <h2>No notes yet</h2>
      <p>Be the first to write something sweet.</p>
      <NuxtLink to="/notes/write" class="compose-btn">Write the First Note</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.notes-page {
  min-height: 100vh;
  padding: 100px 4% 80px;
  max-width: 800px;
  margin: 0 auto;
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 36px;
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
  text-decoration: none;
  transition: background 0.2s, transform 0.15s;
}
.compose-btn svg { width: 18px; height: 18px; }
.compose-btn:hover { background: #f40612; transform: translateY(-1px); }

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 100px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.empty-icon { font-size: 4rem; line-height: 1; }
.empty-state h2 { color: #fff; font-size: 1.5rem; margin: 0; }
.empty-state p { color: #777; margin: 0; }

/* List transitions */
.note-list-enter-active { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.note-list-enter-from   { opacity: 0; transform: translateY(-16px); }
</style>
