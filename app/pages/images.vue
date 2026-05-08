<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useMediaStore } from '../stores/media'
import { useRouter } from 'vue-router'

const mediaStore = useMediaStore()
const router = useRouter()
const { mediaItems } = storeToRefs(mediaStore)

const images = computed(() => {
  return mediaItems.value.filter(item => item.mediaType === 'image')
})

const playMedia = (id: string) => {
  router.push(`/watch/${id}`)
}
</script>

<template>
  <div class="gallery-page">
    <div class="gallery-header">
      <h1>All Images</h1>
      <p>Browse all photos stored in your vault.</p>
    </div>
    
    <div class="gallery-grid" v-if="images.length > 0">
      <div class="grid-item" v-for="item in images" :key="item.id">
        <MediaCard :item="item" @play="playMedia" />
      </div>
    </div>
    
    <div v-else class="empty-state">
      <h2>No images found.</h2>
      <NuxtLink to="/upload" class="upload-btn">Upload Images</NuxtLink>
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
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.grid-item {
  /* MediaCard expects to be in a relative container */
  position: relative;
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
