<script setup lang="ts">
import type { MediaItem } from '../stores/media'

const props = defineProps<{
  title: string
  items: MediaItem[]
}>()

const emit = defineEmits<{
  play: [key: string]
  delete: [id: string]
}>()

const rowRef = ref<HTMLElement | null>(null)

const scrollLeft = () => {
  if (rowRef.value) {
    rowRef.value.scrollBy({ left: -window.innerWidth * 0.8, behavior: 'smooth' })
  }
}

const scrollRight = () => {
  if (rowRef.value) {
    rowRef.value.scrollBy({ left: window.innerWidth * 0.8, behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="media-row-container" v-if="items.length > 0">
    <h2 class="row-title">{{ title }}</h2>
    <div class="slider-wrapper">
      <div class="handle handle-left" @click="scrollLeft">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg>
      </div>
      
      <div class="slider" ref="rowRef">
        <div v-for="item in items" :key="item.id" class="slider-item">
          <MediaCard :item="item" @play="(k) => emit('play', k)" @delete="(id) => emit('delete', id)" />
        </div>
      </div>
      
      <div class="handle handle-right" @click="scrollRight">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
.media-row-container {
  margin: 3vw 0;
  padding: 0;
  position: relative;
}

.row-title {
  color: #e5e5e5;
  font-size: 1.4vw;
  font-weight: 500;
  margin: 0 4% 0.5em 4%;
  line-height: 1.3;
}

@media screen and (max-width: 800px) {
  .row-title {
    font-size: 16px;
  }
}

.slider-wrapper {
  position: relative;
}

.slider {
  display: flex;
  gap: 8px;
  padding: 20px 4%; /* Add padding to top/bottom to allow scale hover without clipping */
  overflow-x: scroll;
  overflow-y: visible; /* Let hovered items pop out */
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}

.slider::-webkit-scrollbar {
  display: none;
}

.slider-item {
  flex: 0 0 calc(100% / 5 - 8px); /* 5 items per row approximately */
  min-width: 200px;
  scroll-snap-align: start;
}

@media screen and (max-width: 1400px) {
  .slider-item {
    flex: 0 0 calc(100% / 4 - 8px);
  }
}

@media screen and (max-width: 1100px) {
  .slider-item {
    flex: 0 0 calc(100% / 3 - 8px);
  }
}

@media screen and (max-width: 800px) {
  .slider-item {
    flex: 0 0 calc(100% / 2 - 8px);
  }
}

/* Handles */
.handle {
  position: absolute;
  top: 20px;
  bottom: 20px;
  width: 4%;
  background: rgba(0,0,0,0.5);
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s, background 0.3s;
}

.slider-wrapper:hover .handle {
  opacity: 1;
}

.handle:hover {
  background: rgba(0,0,0,0.7);
}

.handle svg {
  width: 40px;
  height: 40px;
  transition: transform 0.2s;
}

.handle:hover svg {
  transform: scale(1.2);
}

.handle-left {
  left: 0;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}

.handle-right {
  right: 0;
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}
</style>
