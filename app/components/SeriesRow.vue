<script setup lang="ts">
import SeriesCard from './SeriesCard.vue'

defineProps<{
  title: string
  groups: { id: string; title: string; items: any[] }[]
  type: 'category' | 'date'
}>()

const rowRef = ref<HTMLElement | null>(null)

const scroll = (direction: 'left' | 'right') => {
  if (rowRef.value) {
    const scrollAmount = window.innerWidth * 0.8
    rowRef.value.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }
}
</script>

<template>
  <div class="media-row-container" v-if="groups && groups.length > 0">
    <h2 class="row-title">{{ title }}</h2>
    
    <div class="slider-wrapper">
      <button class="nav-btn left" @click="scroll('left')">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
      </button>
      
      <div class="slider-rail" ref="rowRef">
        <SeriesCard 
          v-for="group in groups" 
          :key="group.id" 
          :id="group.id"
          :title="group.title"
          :items="group.items"
          :type="type"
          class="slider-item"
        />
      </div>

      <button class="nav-btn right" @click="scroll('right')">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
      </button>
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
  .row-title { font-size: 16px; }
}

.slider-wrapper {
  position: relative;
}

.slider-rail {
  display: flex;
  gap: 8px;
  padding: 20px 4%;
  overflow-x: scroll;
  overflow-y: visible;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}

.slider-rail::-webkit-scrollbar {
  display: none;
}

/* Width for Series Cards matched identically to MediaRow */
.slider-item {
  flex: 0 0 calc(100% / 5 - 8px);
  min-width: 200px;
  scroll-snap-align: start;
}

@media screen and (max-width: 1400px) { .slider-item { flex: 0 0 calc(100% / 4 - 8px); } }
@media screen and (max-width: 1100px) { .slider-item { flex: 0 0 calc(100% / 3 - 8px); } }
@media screen and (max-width: 800px)  { .slider-item { flex: 0 0 calc(100% / 2 - 8px); } }

/* Navigation buttons (Handles) matched to MediaRow */
.nav-btn {
  position: absolute;
  top: 20px;
  bottom: 20px;
  width: 4%;
  background: rgba(0,0,0,0.5);
  border: none;
  color: #fff;
  cursor: pointer;
  z-index: 20;
  opacity: 0;
  transition: opacity 0.3s, background 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-btn svg { width: 40px; height: 40px; transition: transform 0.2s; }
.nav-btn.left { 
  left: 0; 
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}
.nav-btn.right { 
  right: 0; 
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}

.slider-wrapper:hover .nav-btn { opacity: 1; }
.nav-btn:hover { background: rgba(0,0,0,0.7); }
.nav-btn:hover svg { transform: scale(1.2); }
</style>
