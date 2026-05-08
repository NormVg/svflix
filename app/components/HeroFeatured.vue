<script setup lang="ts">
import { useMediaStore, type MediaItem } from '../stores/media'
import { computed } from 'vue'

const props = defineProps<{
  item?: MediaItem
}>()

const emit = defineEmits<{
  play: [key: string]
}>()

const mediaStore = useMediaStore()

const displayTitle = computed(() => {
  if (!props.item) return ''
  const title = props.item.title || ''
  
  // Check if title is likely a raw filename
  const isFilename = /\.(mp4|mov|avi|mkv|jpg|jpeg|png|gif|webp|heic)$/i.test(title)
  
  if (title && !isFilename) {
    return title
  }
  
  // Fallback to formatted date
  return new Date(props.item.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
})
</script>

<template>
  <Transition name="hero-fade" mode="out-in">
    <div class="hero" v-if="item" :key="item.id">
      <div class="hero-bg">
        <img 
          v-if="item.mediaType === 'image'" 
          :src="mediaStore.getMediaUrl(item.bucketKey)" 
          class="hero-media" 
        />
        <video 
          v-else 
          :src="mediaStore.getMediaUrl(item.bucketKey)" 
          preload="auto" 
          muted 
          playsinline 
          autoplay 
          loop 
          class="hero-media"
        ></video>
        <div class="hero-vignette"></div>
      </div>
      
      <div class="hero-content">
        <h1 class="hero-title">{{ displayTitle }}</h1>
        <p class="hero-description">{{ item.description || "A special memory saved in the vault." }}</p>
        
        <div class="hero-actions">
          <button class="btn btn-play" @click="emit('play', item.id)">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            Play
          </button>
        </div>
      </div>
    </div>
    <div class="hero hero-empty" v-else key="empty">
      <div class="hero-content">
        <h1 class="hero-title">Welcome to SVFlix</h1>
        <p class="hero-description">Your private space is empty. Start adding memories to see them featured here.</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.hero-fade-enter-active,
.hero-fade-leave-active {
  transition: opacity 1s ease;
}
.hero-fade-enter-from,
.hero-fade-leave-to {
  opacity: 0;
}

.hero {
  position: relative;
  height: 80vh;
  min-height: 500px;
  width: 100%;
  background-color: #000;
  display: flex;
  align-items: center;
  padding: 0 4%;
}

.hero-empty {
  justify-content: center;
  text-align: center;
  background: linear-gradient(135deg, #1a1a1a, #0a0a0a);
}

.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  overflow: hidden;
}

.hero-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 20%;
}

.hero-vignette {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    linear-gradient(to right, #141414 0%, transparent 50%),
    linear-gradient(to top, #141414 0%, transparent 30%);
}

.hero-content {
  position: relative;
  z-index: 2;
  width: 40%;
  min-width: 300px;
}

.hero-empty .hero-content {
  width: 100%;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  margin: 0 0 1rem 0;
  color: #fff;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-description {
  font-size: 1.2rem;
  font-weight: 400;
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  margin-bottom: 1.5rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hero-actions {
  display: flex;
  gap: 1rem;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.6rem 1.5rem;
  font-size: 1.2rem;
  font-weight: 600;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s, background-color 0.2s;
}

.btn svg {
  width: 24px;
  height: 24px;
}

.btn-play {
  background-color: #fff;
  color: #000;
}

.btn-play:hover {
  background-color: rgba(255,255,255,0.75);
}

.btn-more {
  background-color: rgba(109, 109, 110, 0.7);
  color: #fff;
}

.btn-more:hover {
  background-color: rgba(109, 109, 110, 0.4);
}

@media screen and (max-width: 800px) {
  .hero-title {
    font-size: 2rem;
  }
  .hero-description {
    font-size: 1rem;
  }
  .hero-content {
    width: 80%;
  }
}
</style>
