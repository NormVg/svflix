<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useMediaStore } from '../stores/media'
import { useRouter } from 'vue-router'

const mediaStore = useMediaStore()
const router = useRouter()
const { mediaItems } = storeToRefs(mediaStore)

const videos = computed(() => {
  return mediaItems.value.filter(item => item.mediaType === 'video')
})

const playMedia = (id: string) => {
  router.push(`/watch/${id}`)
}
</script>

<template>
  <div class="gallery-page">
    <div class="gallery-header">
      <h1>All Videos</h1>
      <p>Browse all video memories stored in your vault.</p>
    </div>
    
    <div class="gallery-grid" v-if="videos.length > 0">
      <div class="grid-item" v-for="item in videos" :key="item.id">
        <MediaCard :item="item" @play="playMedia" />
      </div>
    </div>
    
    <div v-else class="empty-state">
      <h2>No videos found.</h2>
      <NuxtLink to="/upload" class="upload-btn">Upload Videos</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.gallery-page {
  min-height: 100vh;
  padding: 100px 4% 60px;
  background-color: #141414;
}

.gallery-header {
  margin-bottom: 40px;
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

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  padding: 20px 0;
  overflow: visible;
}

@media screen and (max-width: 1400px) {
  .gallery-grid { grid-template-columns: repeat(4, 1fr); }
}
@media screen and (max-width: 1100px) {
  .gallery-grid { grid-template-columns: repeat(3, 1fr); }
}
@media screen and (max-width: 800px) {
  .gallery-grid { grid-template-columns: repeat(2, 1fr); }
}

.grid-item {
  position: relative;
  aspect-ratio: 16 / 9;
}

.empty-state {
  text-align: center;
  padding: 100px 0;
}
.empty-state h2 {
  color: #fff;
  margin-bottom: 20px;
}
.upload-btn {
  display: inline-block;
  background: #e50914;
  color: white;
  padding: 10px 20px;
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
}
</style>
