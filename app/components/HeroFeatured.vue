<script setup lang="ts">
import { useMediaStore, type MediaItem } from '../stores/media'

const props = defineProps<{
  item?: MediaItem
}>()

const emit = defineEmits<{
  play: [key: string]
}>()

const mediaStore = useMediaStore()

const bgImage = computed(() => {
  if (!props.item) return ''
  // For videos, in a real app we'd auto-play it or show a specific thumbnail.
  // We'll just use a generic background if it's a video and doesn't have an explicit thumbnail.
  if (props.item.mediaType === 'image') {
    return mediaStore.getMediaUrl(props.item.bucketKey)
  }
  return 'https://images.unsplash.com/photo-1574267432553-4b462808152a?auto=format&fit=crop&w=1920&q=80' // placeholder for videos
})
</script>

<template>
  <div class="hero" v-if="item">
    <div class="hero-bg" :style="{ backgroundImage: `url(${bgImage})` }">
      <div class="hero-vignette"></div>
    </div>
    
    <div class="hero-content">
      <h1 v-if="item.title" class="hero-title">{{ item.title }}</h1>
      <p class="hero-description">{{ item.description || "A special memory saved in the vault." }}</p>
      
      <div class="hero-actions">
        <button class="btn btn-play" @click="emit('play', item.bucketKey)">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          Play
        </button>
        <button class="btn btn-more">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
          More Info
        </button>
      </div>
    </div>
  </div>
  <div class="hero hero-empty" v-else>
    <div class="hero-content">
      <h1 class="hero-title">Welcome to SVFlix</h1>
      <p class="hero-description">Your private space is empty. Start adding memories to see them featured here.</p>
    </div>
  </div>
</template>

<style scoped>
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
  background-size: cover;
  background-position: center 20%;
  z-index: 1;
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
