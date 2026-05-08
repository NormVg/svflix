<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useMediaStore } from '../stores/media'

const mediaStore = useMediaStore()
const { groupedByCategory, groupedByDate } = storeToRefs(mediaStore)

</script>

<template>
  <div class="gallery-page">
    <div class="gallery-header">
      <h1>Categories & Collections</h1>
      <p>Browse all your custom groups and chronological timeline series.</p>
    </div>
    
    <div class="categories-content">
      <!-- Collections as Web Series -->
      <SeriesRow title="Collections" :groups="groupedByCategory" type="category" />

      <!-- Timeline as Web Series -->
      <SeriesRow title="Timeline" :groups="groupedByDate" type="date" />
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

.categories-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
