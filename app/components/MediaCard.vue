<script setup lang="ts">
import { useMediaStore, type MediaItem } from '../stores/media'

const props = defineProps<{
  item: MediaItem
}>()

const emit = defineEmits<{
  play: [key: string]
  delete: [id: string]
}>()

const mediaStore = useMediaStore()

const mediaUrl = computed(() => mediaStore.getMediaUrl(props.item.bucketKey))
const isHovered = ref(false)

const thumbnailStyle = computed(() => {
  if (props.item.mediaType === 'image') {
    return { backgroundImage: `url(${mediaUrl.value})` }
  }
  return { backgroundImage: `linear-gradient(to bottom, #222, #000)` }
})
</script>

<template>
  <div 
    class="media-card" 
    @mouseenter="isHovered = true" 
    @mouseleave="isHovered = false"
  >
    <div class="card-thumbnail" :style="thumbnailStyle">
      <div v-if="item.mediaType === 'video'" class="video-indicator">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      </div>
    </div>
    
    <div class="card-details">
      <div class="actions-row">
        <div class="actions-left">
          <button class="btn-circle play-btn" @click.stop="emit('play', item.bucketKey)" title="Play">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
          
          <a class="btn-circle outline-btn" :href="mediaUrl" download title="Download">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          </a>
        </div>

        <div class="actions-right">
          <button class="btn-circle outline-btn delete-btn" @click.stop="emit('delete', item.id)" title="Delete">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
      </div>
      
      <div class="meta-info">
        <div class="meta-primary">
          <span class="match-text">New</span>
          <span class="type-badge">{{ item.mediaType === 'video' ? 'Video' : 'Photo' }}</span>
          <span class="date-text">{{ new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) }}</span>
        </div>
        
        <h3 v-if="item.title" class="custom-title">{{ item.title }}</h3>
        
        <div class="tags" v-if="item.categories && item.categories.length > 0">
          <span v-for="cat in item.categories" :key="cat.id" class="tag-item">{{ cat.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.media-card {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #141414;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.3s cubic-bezier(0.2, 0, 0, 1);
  z-index: 1;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}

.media-card:hover {
  transform: scale(1.15) translateY(-5%);
  box-shadow: 0 15px 30px rgba(0,0,0,0.8);
  z-index: 100;
}

.card-thumbnail {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  transition: opacity 0.3s;
}

.media-card:hover .card-thumbnail {
  opacity: 0.3; /* Darken thumbnail more on hover so text pops */
}

.video-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  color: rgba(255,255,255,0.6);
  transition: opacity 0.3s;
}
.media-card:hover .video-indicator {
  opacity: 0; /* hide the center icon on hover since actions appear */
}

/* Bottom details panel */
.card-details {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(to top, #141414 0%, rgba(20,20,20,0.8) 50%, transparent 100%);
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.3s, transform 0.3s;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.media-card:hover .card-details {
  opacity: 1;
  transform: translateY(0);
}

/* Action Buttons */
.actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.actions-left {
  display: flex;
  gap: 8px;
}

.actions-right {
  display: flex;
}

.btn-circle {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}
.btn-circle svg {
  width: 18px;
  height: 18px;
}

.play-btn {
  background: #fff;
  color: #000;
  border: none;
  width: 38px;
  height: 38px;
}
.play-btn svg {
  width: 20px;
  height: 20px;
}
.play-btn:hover {
  background: #e5e5e5;
  transform: scale(1.1);
}

.outline-btn {
  background: rgba(42,42,42,0.6);
  color: #fff;
  border: 2px solid rgba(255,255,255,0.5);
}
.outline-btn:hover {
  border-color: #fff;
  background: rgba(255,255,255,0.2);
  transform: scale(1.1);
}

.delete-btn {
  border-color: rgba(255,255,255,0.3);
  color: #aaa;
}
.delete-btn:hover {
  border-color: #e50914;
  background: #e50914;
  color: #fff;
}

/* Meta Data */
.meta-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 600;
}

.match-text {
  color: #46d369; /* Netflix Match Green */
}

.type-badge {
  border: 1px solid rgba(255,255,255,0.4);
  padding: 0 4px;
  border-radius: 2px;
  font-size: 0.65rem;
  text-transform: uppercase;
  color: #ddd;
}

.date-text {
  color: #bcbcbc;
  font-weight: 400;
}

.custom-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 0.75rem;
  color: #fff;
}

.tag-item:not(:last-child)::after {
  content: "•";
  margin-left: 6px;
  color: #666;
}
</style>
