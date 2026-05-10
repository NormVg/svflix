<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useMediaStore } from '../../stores/media'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const mediaStore = useMediaStore()

const mediaId = computed(() => route.params.id as string)
const seriesId = route.query.series as string | undefined
const seriesType = route.query.type as string | undefined

const { mediaItems, groupedByCategory, groupedByDate, categories } = storeToRefs(mediaStore)

// Mouse idle tracking for hiding UI
const showControls = ref(true)
let idleTimeout: ReturnType<typeof setTimeout>

const handleMouseMove = () => {
  showControls.value = true
  clearTimeout(idleTimeout)
  idleTimeout = setTimeout(() => {
    // Only hide if we aren't editing or managing categories
    if (!isEditing.value && !showCategoryMenu.value) {
      showControls.value = false
    }
  }, 3000)
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  handleMouseMove()
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  clearTimeout(idleTimeout)
})

// Current Item logic
const currentItem = computed(() => {
  return mediaItems.value.find(item => item.id === mediaId.value)
})

const mediaUrl = ref<string>('')
const isLoadingMedia = ref(false)

const loadCurrentMedia = async () => {
  const item = currentItem.value
  if (!item) {
    mediaUrl.value = ''
    return
  }
  isLoadingMedia.value = true
  try {
    mediaUrl.value = await mediaStore.loadMediaBlob(item.bucketKey)
  } catch (err) {
    console.error('Failed to load media blob:', err)
  } finally {
    isLoadingMedia.value = false
  }
}

// Load media on mount
onMounted(() => {
  loadCurrentMedia()
})

// Reload when currentItem changes (playlist navigation or when store data arrives after mount)
watch(currentItem, (newItem, oldItem) => {
  if (newItem && newItem !== oldItem) {
    loadCurrentMedia()
  }
})

// Playlist / Series logic
const playlist = computed(() => {
  if (seriesId && seriesType) {
    if (seriesType === 'category') {
      const group = groupedByCategory.value.find(g => g.id === seriesId)
      if (group) return group.items
    } else if (seriesType === 'date') {
      const group = groupedByDate.value.find(g => g.id === seriesId)
      if (group) return group.items
    }
  }
  // If no series context, maybe just use all items, but for now just the item itself
  return mediaItems.value
})

const currentIndex = computed(() => {
  return playlist.value?.findIndex(item => item.id === mediaId) ?? -1
})

const hasNext = computed(() => playlist.value && currentIndex.value >= 0 && currentIndex.value < playlist.value.length - 1)
const hasPrev = computed(() => currentIndex.value > 0)

const displayTitle = computed(() => {
  if (!currentItem.value) return ''
  const title = currentItem.value.title || ''
  const isFilename = /\.(mp4|mov|avi|mkv|jpg|jpeg|png|gif|webp|heic)$/i.test(title)
  if (title && !isFilename) return title
  return new Date(currentItem.value.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
})

// Editing logic
const isEditing = ref(false)
const editableTitle = ref('')

const startEditing = () => {
  editableTitle.value = currentItem.value?.title || ''
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
}

const saveTitle = async () => {
  if (!currentItem.value) return
  await mediaStore.updateMedia(currentItem.value.id, { title: editableTitle.value })
  isEditing.value = false
}

const goNext = () => {
  if (hasNext.value && playlist.value) {
    const nextItem = playlist.value[currentIndex.value + 1]
    if (nextItem) {
      const q = seriesId ? `?series=${seriesId}&type=${seriesType}` : ''
      router.replace(`/watch/${nextItem.id}${q}`)
    }
  }
}

const goPrev = () => {
  if (hasPrev.value && playlist.value) {
    const prevItem = playlist.value[currentIndex.value - 1]
    if (prevItem) {
      const q = seriesId ? `?series=${seriesId}&type=${seriesType}` : ''
      router.replace(`/watch/${prevItem.id}${q}`)
    }
  }
}

const goBack = () => {
  if (seriesId && seriesType) {
    router.push(`/series/${seriesType}/${seriesId}`)
  } else {
    router.push('/')
  }
}

// Category Management
const showCategoryMenu = ref(false)
const currentCategoryIds = computed(() => currentItem.value?.categories.map(c => c.id) || [])

const toggleCategory = async (categoryId: string) => {
  if (!currentItem.value) return
  let newIds = [...currentCategoryIds.value]
  if (newIds.includes(categoryId)) {
    newIds = newIds.filter(id => id !== categoryId)
  } else {
    newIds.push(categoryId)
  }
  await mediaStore.updateMedia(currentItem.value.id, { categoryIds: newIds })
}

// Auto-Play Next Episode Logic
let autoNextTimer: ReturnType<typeof setTimeout>

const startAutoNextImage = () => {
  clearTimeout(autoNextTimer)
  if (currentItem.value?.mediaType === 'image' && hasNext.value && !isEditing.value) {
    autoNextTimer = setTimeout(goNext, 5000) // 5 seconds for images
  }
}

const onVideoEnded = () => {
  if (hasNext.value && !isEditing.value) {
    goNext()
  }
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  handleMouseMove()
  startAutoNextImage()
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  clearTimeout(idleTimeout)
  clearTimeout(autoNextTimer)
})

watch(currentItem, () => {
  startAutoNextImage()
})

watch(isEditing, (newVal) => {
  if (newVal) {
    clearTimeout(autoNextTimer)
  } else {
    startAutoNextImage()
  }
})

// Actions
const downloadCurrent = () => {
  if (!currentItem.value) return
  // Fetch the file and trigger download so we don't open in a new tab if inline
  const link = document.createElement('a')
  link.href = mediaUrl.value + '&download=1'
  link.download = currentItem.value.title || 'download'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const deleteCurrent = async () => {
  if (!currentItem.value) return
  if (confirm("Are you sure you want to delete this memory?")) {
    await mediaStore.deleteMedia(currentItem.value.id)
    if (hasNext.value) goNext()
    else goBack()
  }
}

// Fullscreen logic
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`)
    })
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }
}
</script>

<template>
  <div class="watch-page-root">
    <div
      class="watch-player"
      :class="{ 'hide-cursor': !showControls }"
      v-if="currentItem"
      @click="showCategoryMenu = false"
    >
    <!-- Media Renderer -->
    <div class="media-container">
      <div v-if="isLoadingMedia" class="large-spinner"></div>

      <video
        v-if="!isLoadingMedia && mediaUrl && currentItem.mediaType === 'video'"
        key="video"
        :src="mediaUrl"
        controls
        autoplay
        playsinline
        class="media-content video-content"
        @ended="onVideoEnded"
      ></video>

      <img
        v-if="!isLoadingMedia && mediaUrl && currentItem.mediaType === 'image'"
        key="image"
        :src="mediaUrl"
        alt="Memory"
        class="media-content image-content"
      />
    </div>

    <!-- UI Overlay -->
    <Transition name="fade">
      <div class="player-controls" v-show="showControls">
        <!-- Top Bar -->
        <div class="top-bar">
          <div class="top-left">
            <button class="back-btn" @click="goBack">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
              <span>{{ seriesId ? 'Back to Series' : 'Back to Home' }}</span>
            </button>
            <div class="title-info">
              <div v-if="isEditing" class="title-edit-mode">
                <input
                  v-model="editableTitle"
                  class="edit-title-input"
                  @keyup.enter="saveTitle"
                  @keyup.esc="cancelEditing"
                  autofocus
                  :disabled="mediaStore.loading"
                />
                <button class="icon-btn-small" @click="saveTitle" :disabled="mediaStore.loading" title="Save">
                  <div v-if="mediaStore.loading" class="spinner-small"></div>
                  <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                </button>
                <button class="icon-btn-small" @click="cancelEditing" :disabled="mediaStore.loading" title="Cancel">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
                </button>
              </div>
              <div v-else class="title-view-mode">
                <h2 class="current-title">{{ displayTitle }}</h2>
                <button class="edit-btn-tiny" @click="startEditing" title="Edit Title">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div class="top-right">
            <div class="category-menu-wrapper">
              <button class="control-btn action-btn" @click.stop="showCategoryMenu = !showCategoryMenu" title="Add to Collection">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/></svg>
              </button>
              <div v-if="showCategoryMenu" class="category-dropdown" @click.stop>
                <h3>Collections</h3>
                <div class="category-list">
                  <label v-for="cat in categories" :key="cat.id" class="category-option">
                    <input
                      type="checkbox"
                      :checked="currentCategoryIds.includes(cat.id)"
                      @change="toggleCategory(cat.id)"
                      :disabled="mediaStore.loading"
                    />
                    <span class="checkmark"></span>
                    {{ cat.name }}
                  </label>
                  <div v-if="categories.length === 0" class="no-categories">
                    No collections yet.
                  </div>
                </div>
              </div>
            </div>
            <div class="ep-counter" v-if="seriesId">
              Episode {{ currentIndex + 1 }} of {{ playlist?.length || 0 }}
            </div>
            <button class="control-btn action-btn" @click="downloadCurrent" title="Download">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            </button>
            <button class="control-btn action-btn danger" @click="deleteCurrent" title="Delete">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
            <button class="control-btn" @click="toggleFullscreen" title="Fullscreen">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
            </button>
          </div>
        </div>

        <!-- Navigation Arrows (Side) — outside controls so they're positioned against .watch-player -->
        <button v-if="hasPrev" class="nav-arrow left" @click="goPrev" title="Previous Episode">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg>
        </button>
        <button v-if="hasNext" class="nav-arrow right" @click="goNext" title="Next Episode">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
        </button>
      </div>
    </Transition>
  </div>
  <div v-else class="not-found">
    <h2>Memory not found.</h2>
    <button @click="router.push('/')">Go Home</button>
  </div>
  </div>
</template>

<style scoped>
.watch-page-root {
  animation: watch-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes watch-enter {
  from {
    opacity: 0;
    transform: scale(1.03);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.watch-player {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #000;
  z-index: 9999;
}

.watch-player.hide-cursor {
  cursor: none;
}

.media-container {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.media-content {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.image-content {
  transition: opacity 0.3s ease;
}

/* UI Controls Overlay */
.player-controls {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100%; height: 100%;
  pointer-events: none; /* Let clicks pass through to media except for buttons */
}

.player-controls > * {
  pointer-events: auto;
}

.top-bar {
  position: absolute;
  top: 0; left: 0; right: 0;
  padding: 30px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%);
}

.top-left {
  display: flex;
  align-items: center;
  gap: 30px;
  flex: 1;
  min-width: 0; /* Allows children to truncate */
}

.top-right {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}

.back-btn {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.2rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s, transform 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}
.back-btn:hover {
  opacity: 1;
  transform: translateX(-5px);
}
.back-btn svg { width: 32px; height: 32px; }

.title-info h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fallback-title {
  font-weight: 400 !important;
  color: #ddd;
}

.title-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.title-edit-mode,
.title-view-mode {
  display: flex;
  align-items: center;
  gap: 15px;
  width: 100%;
}

.edit-btn-tiny {
  background: transparent;
  border: none;
  color: #aaa;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  opacity: 0.5;
  transition: opacity 0.2s, color 0.2s;
}
.edit-btn-tiny:hover {
  opacity: 1;
  color: #fff;
}
.edit-btn-tiny svg { width: 16px; height: 16px; }

.edit-title-input {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff;
  font-size: 1.4rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  outline: none;
  width: 300px;
}
.edit-title-input:focus {
  border-color: #fff;
  background: rgba(255,255,255,0.15);
}

.icon-btn-small {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  opacity: 0.7;
  transition: opacity 0.2s;
}
.icon-btn-small:hover {
  opacity: 1;
}
.icon-btn-small svg { width: 20px; height: 20px; }

.spinner-small {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.large-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255,255,255,0.1);
  border-radius: 50%;
  border-top-color: #e50914;
  animation: spin 1s linear infinite;
  z-index: 10;
}

.ep-counter {
  font-size: 1.1rem;
  font-weight: 600;
  color: #ccc;
  letter-spacing: 0.5px;
}

.control-btn {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s, transform 0.2s;
}
.control-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}
.control-btn svg { width: 32px; height: 32px; }

.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0,0,0,0.3);
  border: none;
  color: #fff;
  width: 60px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.nav-arrow:hover {
  background: rgba(0,0,0,0.7);
  transform: translateY(-50%) scale(1.1);
}
.nav-arrow svg { width: 40px; height: 40px; }
.nav-arrow.left { left: 0; border-top-right-radius: 8px; border-bottom-right-radius: 8px; }
.nav-arrow.right { right: 0; border-top-left-radius: 8px; border-bottom-left-radius: 8px; }

.category-menu-wrapper {
  position: relative;
}

.category-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 10px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 6px;
  width: 250px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.9);
  padding: 15px;
  z-index: 1000;
  cursor: default;
}

.category-dropdown h3 {
  margin: 0 0 10px 0;
  font-size: 1rem;
  color: #fff;
  border-bottom: 1px solid #333;
  padding-bottom: 8px;
}

.category-list {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-option {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ccc;
  font-size: 0.95rem;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.2s;
}

.category-option:hover {
  color: #fff;
}

.category-option input {
  cursor: pointer;
}

.no-categories {
  color: #888;
  font-size: 0.85rem;
  font-style: italic;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.not-found {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #141414;
  color: white;
  gap: 20px;
}
.not-found button {
  padding: 10px 20px;
  background: #e50914;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 4px;
}
</style>
