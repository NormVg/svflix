<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useMediaStore } from '../stores/media'

const mediaStore = useMediaStore()
const { groupedByCategory, groupedByDate } = storeToRefs(mediaStore)

const isCreating = ref(false)
const newCategoryName = ref('')
const newCategoryDesc = ref('')
const isSubmitting = ref(false)

const handleCreateCategory = async () => {
  if (!newCategoryName.value.trim()) return
  isSubmitting.value = true
  await mediaStore.createCategory(newCategoryName.value.trim(), newCategoryDesc.value.trim())
  isSubmitting.value = false
  isCreating.value = false
  newCategoryName.value = ''
  newCategoryDesc.value = ''
}
</script>

<template>
  <div class="gallery-page">
    <div class="gallery-header">
      <div class="header-content">
        <div>
          <h1>Categories & Collections</h1>
          <p>Browse all your custom groups and chronological timeline series.</p>
        </div>
        <button class="create-btn" @click="isCreating = true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          New Collection
        </button>
      </div>
    </div>
    
    <div class="categories-content">
      <SeriesRow title="Collections" :groups="groupedByCategory" type="category" />
      <SeriesRow title="Timeline" :groups="groupedByDate" type="date" />
    </div>

    <!-- Create Modal -->
    <div class="modal-overlay" v-if="isCreating" @click.self="isCreating = false">
      <div class="modal-content">
        <h2>Create Collection</h2>
        <div class="form-group">
          <label>Name</label>
          <input v-model="newCategoryName" placeholder="e.g. Summer Vacation" autofocus />
        </div>
        <div class="form-group">
          <label>Description (Optional)</label>
          <input v-model="newCategoryDesc" placeholder="e.g. Best trip ever..." />
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="isCreating = false">Cancel</button>
          <button class="save-btn" @click="handleCreateCategory" :disabled="isSubmitting || !newCategoryName.trim()">
            {{ isSubmitting ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gallery-page {
  min-height: 100vh;
  padding: 100px 0 60px;
  background-color: #141414;
}

.gallery-header {
  margin-bottom: 40px;
  padding: 0 4%;
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}
.gallery-header h1 {
  font-size: 2.5rem;
  color: #fff;
  margin: 0 0 10px 0;
}
.gallery-header p {
  color: #aaa;
  font-size: 1.1rem;
  margin: 0;
}

.create-btn {
  background: #fff;
  color: #000;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.create-btn svg { width: 24px; height: 24px; }
.create-btn:hover { background: #e5e5e5; }

.categories-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}
.modal-content {
  background: #141414;
  border: 1px solid #333;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.8);
}
.modal-content h2 {
  margin: 0 0 20px 0;
  color: #fff;
}
.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #aaa;
  font-size: 0.9rem;
}
.form-group input {
  width: 100%;
  padding: 12px;
  background: #222;
  border: 1px solid #333;
  color: #fff;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}
.form-group input:focus {
  outline: none;
  border-color: #e50914;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
}
.cancel-btn {
  background: transparent;
  border: 1px solid #555;
  color: #fff;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
.cancel-btn:hover { background: #222; }
.save-btn {
  background: #e50914;
  border: none;
  color: #fff;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}
.save-btn:hover:not(:disabled) { background: #f40612; }
.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
