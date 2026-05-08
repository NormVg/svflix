<script setup lang="ts">
import { useMediaStore } from '../stores/media'
import { useRouter } from 'vue-router'
import type { Category, MediaItem } from '../stores/media'

const props = defineProps<{
  id: string; // Could be category ID or date string
  title: string;
  items: MediaItem[];
  type: 'category' | 'date';
}>()

const router = useRouter()
const mediaStore = useMediaStore()

const coverItem = computed(() => {
  return props.items.length > 0 ? props.items[0] : null
})

const coverUrl = computed(() => {
  if (coverItem.value) {
    return mediaStore.getMediaUrl(coverItem.value.bucketKey)
  }
  return ''
})

const isHovered = ref(false)

const thumbnailStyle = computed(() => {
  if (coverUrl.value) {
    return { backgroundImage: `url(${coverUrl.value})` }
  }
  return { backgroundImage: `linear-gradient(to bottom, #222, #000)` }
})

const openSeries = () => {
  router.push(`/series/${props.type}/${props.id}`)
}
</script>

<template>
  <div 
    class="series-card" 
    @mouseenter="isHovered = true" 
    @mouseleave="isHovered = false"
    @click="openSeries"
  >
    <div class="card-thumbnail" :style="thumbnailStyle"></div>
    
    <div class="card-details">
      <div class="actions-row">
        <button class="btn-circle play-btn" @click.stop="openSeries" title="View Series">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
      </div>
      
      <h3 class="series-title">{{ title }}</h3>
      
      <div class="meta-info">
        <span class="match-text">Series</span>
        <span class="ep-count">{{ items.length }} Memories</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.series-card {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9; /* Changed to standard Netflix horizontal card to fix squishing */
  background-color: #141414;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.3s cubic-bezier(0.2, 0, 0, 1);
  z-index: 1;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}

.series-card:hover {
  transform: scale(1.15) translateY(-5%); /* Matched MediaCard scale */
  box-shadow: 0 15px 30px rgba(0,0,0,0.8);
  z-index: 100;
}

.card-thumbnail {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-size: cover;
  background-position: center;
  transition: opacity 0.3s;
}

.series-card:hover .card-thumbnail {
  opacity: 0.4; /* Darken so text pops, but not too dark */
}

/* Bottom details panel */
.card-details {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(to top, #141414 0%, rgba(20,20,20,0.8) 60%, transparent 100%);
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.3s, transform 0.3s;
  display: flex;
  flex-direction: column;
}

.series-card:hover .card-details {
  opacity: 1;
  transform: translateY(0);
}

.actions-row {
  margin-bottom: 8px;
  display: flex;
}

.btn-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fff;
  color: #000;
  border: none;
}
.btn-circle svg {
  width: 20px;
  height: 20px;
}
.btn-circle:hover {
  background: #e5e5e5;
  transform: scale(1.1);
}

.series-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 6px 0;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 600;
}

.match-text {
  color: #46d369; /* Netflix Match Green */
}

.ep-count {
  color: #bcbcbc;
  font-weight: 400;
}
</style>
