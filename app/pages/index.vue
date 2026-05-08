<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useMediaStore } from '../stores/media'

const mediaStore = useMediaStore()
const { mediaItems, groupedByCategory } = storeToRefs(mediaStore)

const playMedia = (key: string) => {
  window.open(mediaStore.getMediaUrl(key), '_blank')
}

const handleDelete = async (id: string) => {
  await mediaStore.deleteMedia(id)
}

const featuredItem = computed(() => {
  return mediaItems.value.length > 0 ? mediaItems.value[0] : undefined
})
</script>

<template>
  <div class="dashboard">
    <HeroFeatured :item="featuredItem" @play="playMedia" />

    <div class="rails-container">
      <!-- Recent -->
      <MediaRow title="Recently Added" :items="mediaItems" @play="playMedia" @delete="handleDelete" />
      
      <!-- Categories -->
      <MediaRow 
        v-for="group in groupedByCategory" 
        :key="group.category.id"
        :title="group.category.name"
        :items="group.items"
        @play="playMedia" 
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<style scoped>
.rails-container {
  padding-bottom: 60px;
  margin-top: -8vw; /* Pull rails up over the hero vignette */
  position: relative;
  z-index: 10;
}
</style>
