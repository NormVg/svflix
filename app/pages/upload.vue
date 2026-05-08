<script setup lang="ts">
import { useMediaStore } from '../stores/media'
import { useRouter } from 'vue-router'

const mediaStore = useMediaStore()
const router = useRouter()

const isDragging = ref(false)

type StagedFile = {
  file: File;
  title: string;
  mediaType: 'image' | 'video';
  id: number;
  previewUrl: string;
}

const selectedFiles = ref<StagedFile[]>([])
const nextId = ref(0)

const commonCategories = ref<string[]>([])
const commonPath = ref("memories/")

const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadMessage = ref("")

const handleDragEnter = (e: DragEvent) => { e.preventDefault(); isDragging.value = true; }
const handleDragLeave = (e: DragEvent) => { e.preventDefault(); isDragging.value = false; }
const handleDragOver = (e: DragEvent) => { e.preventDefault(); isDragging.value = true; }

const addFiles = (files: FileList | File[]) => {
  Array.from(files).forEach(file => {
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) return // Skip unsupported files

    const previewUrl = isImage ? URL.createObjectURL(file) : ''

    selectedFiles.value.push({
      file,
      title: '', // Leave blank so raw filenames aren't saved as titles by default
      mediaType: isVideo ? 'video' : 'image',
      id: nextId.value++,
      previewUrl
    })
  })
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
  if (e.dataTransfer?.files) {
    addFiles(e.dataTransfer.files)
  }
}

const handleFileInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files) {
    addFiles(target.files)
  }
}

const removeFile = (id: number) => {
  const index = selectedFiles.value.findIndex(f => f.id === id)
  if (index > -1) {
    const item = selectedFiles.value[index]
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
    selectedFiles.value.splice(index, 1)
  }
}

const toggleCategory = (categoryId: string) => {
  const idx = commonCategories.value.indexOf(categoryId)
  if (idx > -1) {
    commonCategories.value.splice(idx, 1)
  } else {
    commonCategories.value.push(categoryId)
  }
}

const startUpload = async () => {
  if (selectedFiles.value.length === 0) return
  
  isUploading.value = true
  uploadProgress.value = 0
  let successCount = 0

  for (let i = 0; i < selectedFiles.value.length; i++) {
    const item = selectedFiles.value[i]
    uploadMessage.value = `Uploading ${i + 1} of ${selectedFiles.value.length}: ${item.title}`
    
    const result = await mediaStore.upload({
      file: item.file,
      key: commonPath.value,
      mediaType: item.mediaType,
      title: item.title,
      description: "", 
      categoryIds: commonCategories.value
    })

    if (result.success) {
      successCount++
    }
    uploadProgress.value = Math.round(((i + 1) / selectedFiles.value.length) * 100)
  }

  uploadMessage.value = `Successfully uploaded ${successCount} files.`
  
  // Cleanup object urls
  selectedFiles.value.forEach(item => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
  })

  setTimeout(() => {
    router.push('/')
  }, 1500)
}

onUnmounted(() => {
  selectedFiles.value.forEach(item => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
  })
})
</script>

<template>
  <div class="upload-page">
    <div class="upload-header">
      <h1>Add to Vault</h1>
      <p class="subtitle">Securely upload memories to your private space.</p>
    </div>

    <div class="upload-layout">
      <!-- Left side: Dropzone and File List -->
      <div class="upload-main">
        <div 
          class="dropzone" 
          :class="{ 'is-dragging': isDragging, 'has-files': selectedFiles.length > 0 }"
          @dragenter="handleDragEnter"
          @dragleave="handleDragLeave"
          @dragover="handleDragOver"
          @drop="handleDrop"
        >
          <input type="file" id="file-input" multiple @change="handleFileInput" accept="image/*,video/*" hidden />
          <label for="file-input" class="dropzone-content">
            <div class="drop-icon-wrap">
              <svg viewBox="0 0 24 24" fill="currentColor" class="upload-icon"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
            </div>
            <h3>Drag & Drop files here</h3>
            <p>or <span class="text-highlight">click to browse</span></p>
          </label>
        </div>

        <Transition name="fade">
          <div class="file-list-container" v-if="selectedFiles.length > 0">
            <div class="file-list-header">
              <h3>Staged Memories ({{ selectedFiles.length }})</h3>
            </div>
            <TransitionGroup name="list" tag="div" class="file-grid">
              <div class="file-card" v-for="item in selectedFiles" :key="item.id">
                <div class="file-bg" :style="{ backgroundImage: item.previewUrl ? `url(${item.previewUrl})` : 'none' }"></div>
                <div class="file-overlay"></div>
                
                <div class="file-card-content">
                  <div class="file-type-badge">
                    <svg v-if="item.mediaType === 'video'" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                    {{ item.mediaType }}
                  </div>
                  <input v-model="item.title" class="title-input" placeholder="Memory Title" />
                </div>
                <button class="remove-btn" @click="removeFile(item.id)">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
              </div>
            </TransitionGroup>
          </div>
        </Transition>
      </div>

      <!-- Right side: Bulk Settings & Action -->
      <Transition name="slide-up">
        <div class="upload-sidebar" v-if="selectedFiles.length > 0">
          <div class="settings-card glass-panel">
            <h3>Batch Settings</h3>
            
            <div class="form-group">
              <label>Storage Path</label>
              <input v-model="commonPath" placeholder="memories/" class="dark-input" />
              <span class="help-text">End with '/' to auto-generate filenames.</span>
            </div>

            <div class="form-group">
              <label>Categories</label>
              <div class="category-pills">
                <button 
                  v-for="category in mediaStore.categories" 
                  :key="category.id"
                  class="cat-pill"
                  :class="{ active: commonCategories.includes(category.id) }"
                  @click="toggleCategory(category.id)"
                >
                  {{ category.name }}
                </button>
                <div v-if="mediaStore.categories.length === 0" class="help-text">No categories available.</div>
              </div>
            </div>

            <div class="upload-status" v-if="isUploading">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
              </div>
              <p class="status-msg">{{ uploadMessage }}</p>
            </div>

            <button 
              class="btn-primary" 
              :disabled="isUploading" 
              @click="startUpload"
            >
              <span class="btn-text">{{ isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} Memories` }}</span>
              <svg v-if="!isUploading" viewBox="0 0 24 24" fill="currentColor" class="btn-icon"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.upload-page {
  padding: 100px 4% 60px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
}

.upload-header {
  margin-bottom: 40px;
}
.upload-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}
.subtitle {
  color: #999;
  font-size: 1.1rem;
}

.upload-layout {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

.upload-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 30px;
  min-width: 0; /* prevent flex blowout */
}

.upload-sidebar {
  width: 350px;
  position: sticky;
  top: 100px;
}

@media screen and (max-width: 900px) {
  .upload-layout {
    flex-direction: column;
  }
  .upload-sidebar {
    width: 100%;
    position: static;
  }
}

/* Dropzone */
.dropzone {
  border: 2px dashed #333;
  border-radius: 12px;
  background: rgba(20,20,20,0.6);
  transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.dropzone.has-files {
  border-style: solid;
  border-color: #333;
  padding: 20px 0;
}
.dropzone.has-files .dropzone-content {
  padding: 30px 20px;
}
.dropzone.is-dragging {
  border-color: #e50914;
  background: rgba(229, 9, 20, 0.05);
  transform: scale(1.02);
}
.dropzone:hover {
  border-color: #555;
  background: rgba(40,40,40,0.6);
}
.dropzone.is-dragging:hover {
  border-color: #e50914;
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  cursor: pointer;
  transition: padding 0.3s;
}

.drop-icon-wrap {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255,255,255,0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  transition: transform 0.3s, background 0.3s;
}
.dropzone:hover .drop-icon-wrap {
  transform: translateY(-5px);
  background: rgba(255,255,255,0.1);
}
.dropzone.is-dragging .drop-icon-wrap {
  background: rgba(229, 9, 20, 0.1);
  color: #e50914;
}

.upload-icon {
  width: 40px;
  height: 40px;
  color: #888;
  transition: color 0.3s;
}
.dropzone.is-dragging .upload-icon {
  color: #e50914;
}

.dropzone-content h3 {
  font-size: 1.4rem;
  margin-bottom: 8px;
  font-weight: 500;
}
.dropzone-content p {
  color: #888;
}
.text-highlight {
  color: #e5e5e5;
  text-decoration: underline;
  text-underline-offset: 4px;
}

/* File List */
.file-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.file-list-header h3 {
  font-size: 1.2rem;
  color: #fff;
  font-weight: 500;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.file-card {
  position: relative;
  aspect-ratio: 16 / 10;
  border-radius: 8px;
  overflow: hidden;
  background: #222;
  box-shadow: 0 4px 10px rgba(0,0,0,0.4);
  transition: transform 0.3s, box-shadow 0.3s;
}
.file-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.6);
}

.file-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-size: cover;
  background-position: center;
  z-index: 1;
}

.file-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, transparent 100%);
  z-index: 2;
}

.file-card-content {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 16px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-type-badge {
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(4px);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.65rem;
  text-transform: uppercase;
  color: #fff;
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.file-type-badge svg {
  width: 12px; height: 12px;
}

.title-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(255,255,255,0.3);
  color: #fff;
  padding: 4px 0;
  font-size: 0.95rem;
  font-weight: 500;
  width: 100%;
  transition: border-color 0.2s;
}
.title-input:focus {
  outline: none;
  border-color: #e50914;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 4;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s;
}
.remove-btn svg { width: 16px; height: 16px; }
.file-card:hover .remove-btn {
  opacity: 1;
  transform: scale(1);
}
.remove-btn:hover {
  background: #e50914;
}

/* Sidebar Settings */
.glass-panel {
  background: rgba(30, 30, 30, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.05);
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.settings-card {
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-card h3 {
  font-size: 1.2rem;
  font-weight: 600;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.form-group label {
  color: #aaa;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dark-input {
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  padding: 12px 16px;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.95rem;
  transition: all 0.2s;
}
.dark-input:focus {
  outline: none;
  border-color: #e50914;
  background: rgba(0,0,0,0.6);
}

.category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.cat-pill {
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.1);
  color: #ccc;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.cat-pill:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}
.cat-pill.active {
  background: #e50914;
  border-color: #e50914;
  color: #fff;
  font-weight: 500;
}

.help-text {
  font-size: 0.8rem;
  color: #666;
}

.btn-primary {
  background: #e50914;
  color: #fff;
  padding: 16px;
  border: none;
  border-radius: 6px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}
.btn-primary:hover:not(:disabled) {
  background: #f40612;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(229, 9, 20, 0.4);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-icon {
  width: 20px;
  height: 20px;
}

/* Progress */
.upload-status {
  margin-top: 5px;
}
.progress-bar {
  background: rgba(0,0,0,0.5);
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}
.progress-fill {
  background: #e50914;
  height: 100%;
  transition: width 0.3s ease-out;
}
.status-msg {
  font-size: 0.85rem;
  color: #aaa;
}

/* Transitions */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.2, 0, 0, 1);
}
.list-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
.list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.list-leave-active {
  position: absolute; /* Ensures smooth reflow for other items */
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.5s cubic-bezier(0.2, 0, 0, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(40px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
