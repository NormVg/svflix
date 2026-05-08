<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useMediaStore } from '../stores/media'
import SeriesRow from '../components/SeriesRow.vue'

const mediaStore = useMediaStore()
const { mediaItems, groupedByCategory, groupedByDate } = storeToRefs(mediaStore)

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
      <!-- Recently Added (Raw items) -->
      <MediaRow title="Recently Added" :items="mediaItems.slice(0, 15)" @play="playMedia" @delete="handleDelete" />
      
      <!-- Collections as Web Series -->
      <SeriesRow title="Collections" :groups="groupedByCategory" type="category" />

      <!-- Timeline as Web Series -->
      <SeriesRow title="Timeline" :groups="groupedByDate" type="date" />
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
