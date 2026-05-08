<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useMediaStore } from '../stores/media'
import SeriesRow from '../components/SeriesRow.vue'

const mediaStore = useMediaStore()
const { mediaItems, groupedByCategory, groupedByDate } = storeToRefs(mediaStore)

const router = useRouter()

const playMedia = (id: string) => {
  router.push(`/watch/${id}`)
}

const randomSeed = ref(Math.random())
let bannerInterval: NodeJS.Timeout

onMounted(() => {
  randomSeed.value = Math.random()
  bannerInterval = setInterval(() => {
    randomSeed.value = Math.random()
  }, 10000) // 10 seconds
})

onUnmounted(() => {
  clearInterval(bannerInterval)
})

const featuredItem = computed(() => {
  if (mediaItems.value.length === 0) return undefined
  const randomIndex = Math.floor(randomSeed.value * mediaItems.value.length)
  return mediaItems.value[randomIndex]
})
</script>

<template>
  <div class="dashboard">
    <HeroFeatured :item="featuredItem" @play="playMedia" />

    <div class="rails-container">
      <!-- Recently Added (Raw items) -->
      <MediaRow title="Recently Added" :items="mediaItems.slice(0, 15)" @play="playMedia" />
      
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
