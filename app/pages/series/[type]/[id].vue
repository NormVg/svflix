<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useMediaStore } from '../../../stores/media'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const mediaStore = useMediaStore()

const type = route.params.type as string
const id = route.params.id as string

const { groupedByCategory, groupedByDate } = storeToRefs(mediaStore)

const seriesData = computed(() => {
  if (type === 'category') {
    return groupedByCategory.value.find(g => g.id === id)
  } else if (type === 'date') {
    return groupedByDate.value.find(g => g.id === id)
  }
  return null
})

const coverUrl = computed(() => {
  if (seriesData.value && seriesData.value.items.length > 0) {
    return mediaStore.getMediaUrl(seriesData.value.items[0].bucketKey)
  }
  return ''
})

const playMedia = (itemId: string) => {
  router.push(`/watch/${itemId}?series=${id}&type=${type}`)
}

const handleDelete = async (itemId: string) => {
  if (confirm("Are you sure you want to delete this memory? This action cannot be undone.")) {
    await mediaStore.deleteMedia(itemId)
  }
}

const getDisplayTitle = (item: any, index: number) => {
  const title = item.title || ''
  const isFilename = /\.(mp4|mov|avi|mkv|jpg|jpeg|png|gif|webp|heic)$/i.test(title)
  if (title && !isFilename) return title
  return `Memory ${index + 1}`
}
</script>

<template>
  <div class="series-page" v-if="seriesData">
    <!-- Hero Header -->
    <div class="series-hero">
      <div class="hero-bg" :style="{ backgroundImage: coverUrl ? `url(${coverUrl})` : 'none' }"></div>
      <div class="hero-vignette"></div>
      
      <div class="hero-content">
        <button class="back-btn" @click="router.push('/')">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          Back to Browse
        </button>
        
        <h1 class="series-title">{{ seriesData.title }}</h1>
        <div class="series-meta">
          <span class="match-text">100% Match</span>
          <span class="year">{{ new Date().getFullYear() }}</span>
          <span class="ep-count">{{ seriesData.items.length }} Episodes</span>
          <span class="badge">HD</span>
        </div>
        
        <p class="series-desc">A beautiful collection of memories captured and stored in the vault.</p>
        
        <div class="hero-actions">
          <button class="btn-play" v-if="seriesData.items.length > 0" @click="playMedia(seriesData.items[0].id)">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Play First
          </button>
        </div>
      </div>
    </div>

    <!-- Episode List -->
    <div class="episodes-section">
      <div class="episodes-header">
        <h2>Episodes</h2>
        <span class="season-badge">Season 1</span>
      </div>
      
      <div class="episodes-grid">
        <div class="episode-row" v-for="(item, index) in seriesData.items" :key="item.id">
          <div class="ep-number">{{ index + 1 }}</div>
          
          <div class="ep-thumbnail" @click="playMedia(item.id)">
            <img 
              v-if="item.mediaType === 'image'" 
              :src="mediaStore.getMediaUrl(item.bucketKey)" 
              class="thumb-bg" 
            />
            <video 
              v-else 
              :src="mediaStore.getMediaUrl(item.bucketKey) + '#t=1.0'" 
              preload="metadata" 
              muted 
              playsinline 
              class="thumb-bg"
            ></video>
            <div class="play-overlay">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <div v-if="item.mediaType === 'video'" class="video-indicator">Video</div>
          </div>
          
          <div class="ep-info">
            <div class="ep-header">
              <h3 class="ep-title">{{ getDisplayTitle(item, index) }}</h3>
              <span class="ep-date">{{ new Date(item.createdAt).toLocaleDateString() }}</span>
            </div>
            <p class="ep-desc">{{ item.description || 'No description provided.' }}</p>
          </div>
          
          <div class="ep-actions">
            <a class="action-btn outline-btn" :href="mediaStore.getMediaUrl(item.bucketKey)" download title="Download">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            </a>
            <button class="action-btn delete-btn" @click="handleDelete(item.id)" title="Delete">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="not-found">
    <h2>Series not found.</h2>
    <button @click="router.push('/')">Go Home</button>
  </div>
</template>

<style scoped>
.series-page {
  min-height: 100vh;
  background-color: #141414;
}

/* Hero Section */
.series-hero {
  position: relative;
  height: 70vh;
  min-height: 500px;
  display: flex;
  align-items: flex-end;
}

.hero-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-size: cover;
  background-position: center 20%;
  z-index: 1;
}

.hero-vignette {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: 
    linear-gradient(to top, #141414 0%, transparent 60%),
    linear-gradient(to right, #141414 0%, transparent 50%);
  z-index: 2;
}

.hero-content {
  position: relative;
  z-index: 3;
  padding: 0 4% 5%;
  width: 100%;
  max-width: 800px;
}

.back-btn {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  margin-bottom: 20px;
  opacity: 0.7;
  transition: opacity 0.2s, transform 0.2s;
}
.back-btn:hover {
  opacity: 1;
  transform: translateX(-5px);
}
.back-btn svg { width: 24px; height: 24px; }

.series-title {
  font-size: 4vw;
  font-weight: 800;
  margin-bottom: 15px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
  line-height: 1.1;
}

.series-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 15px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}
.match-text { color: #46d369; }
.badge { border: 1px solid rgba(255,255,255,0.4); padding: 0 4px; border-radius: 3px; font-size: 0.8rem; }
.ep-count { color: #fff; }
.year { color: #e5e5e5; }

.series-desc {
  font-size: 1.2rem;
  line-height: 1.5;
  color: #fff;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
  margin-bottom: 25px;
  max-width: 600px;
}

.hero-actions {
  display: flex;
  gap: 15px;
}

.btn-play {
  background: #fff;
  color: #000;
  border: none;
  padding: 10px 24px 10px 20px;
  border-radius: 4px;
  font-size: 1.2rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-play svg { width: 28px; height: 28px; }
.btn-play:hover { background: rgba(255,255,255,0.7); }

/* Episodes Section */
.episodes-section {
  padding: 0 4% 60px;
  max-width: 1200px;
  margin: 0 auto;
}

.episodes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  border-bottom: 2px solid #333;
  padding-bottom: 10px;
}
.episodes-header h2 { font-size: 1.5rem; font-weight: 500; }
.season-badge { font-size: 1.2rem; font-weight: 600; color: #aaa; }

.episodes-grid {
  display: flex;
  flex-direction: column;
}

.episode-row {
  display: flex;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #222;
  transition: background 0.2s;
  border-radius: 4px;
}
.episode-row:hover {
  background: #222;
}

.ep-number {
  width: 50px;
  font-size: 1.5rem;
  color: #555;
  text-align: center;
  font-weight: 400;
}

.ep-thumbnail {
  position: relative;
  width: 140px;
  height: 80px;
  border-radius: 4px;
  background: #333;
  overflow: hidden;
  cursor: pointer;
  margin: 0 20px;
  flex-shrink: 0;
}
.thumb-bg {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: opacity 0.2s;
  display: block;
}
.play-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}
.play-overlay svg { width: 40px; height: 40px; color: #fff; }
.ep-thumbnail:hover .play-overlay { opacity: 1; }
.video-indicator {
  position: absolute;
  bottom: 4px; right: 4px;
  background: rgba(0,0,0,0.7);
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 0.6rem;
  text-transform: uppercase;
}

.ep-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.ep-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}
.ep-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}
.ep-date {
  font-size: 0.9rem;
  color: #aaa;
}
.ep-desc {
  color: #888;
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0;
}

.ep-actions {
  display: flex;
  gap: 10px;
  padding: 0 20px;
  opacity: 0;
  transition: opacity 0.2s;
}
.episode-row:hover .ep-actions {
  opacity: 1;
}

.action-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}
.action-btn svg { width: 18px; height: 18px; }
.outline-btn {
  border: 1px solid rgba(255,255,255,0.4);
  color: #fff;
}
.outline-btn:hover {
  border-color: #fff;
  background: rgba(255,255,255,0.2);
}
.delete-btn {
  border: 1px solid rgba(255,255,255,0.2);
  color: #aaa;
}
.delete-btn:hover {
  border-color: #e50914;
  background: #e50914;
  color: #fff;
}

/* Not Found */
.not-found {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}
.not-found button {
  padding: 10px 20px;
  background: #e50914;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 4px;
}
</style>
