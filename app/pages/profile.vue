<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useMediaStore } from '../stores/media'

const router = useRouter()
const authStore = useAuthStore()
const mediaStore = useMediaStore()

const { currentUser } = storeToRefs(authStore)
const { mediaItems } = storeToRefs(mediaStore)

const totalMemories = computed(() => mediaItems.value.length)
const videoCount = computed(() => mediaItems.value.filter(m => m.mediaType === 'video').length)
const imageCount = computed(() => mediaItems.value.filter(m => m.mediaType === 'image').length)

const resetSystem = async () => {
  if (confirm("WARNING: This will delete ALL media, categories, and chat history. Are you absolutely sure?")) {
    try {
      await $fetch('/api/system/reset')
      alert("System has been fully reset. You will be signed out.")
      await authStore.logout()
    } catch (e) {
      alert("Failed to reset system.")
    }
  }
}
</script>

<template>
  <div class="profile-page">
    <div class="profile-header">
      <h1>Vault Profile</h1>
    </div>
    
    <div class="profile-content">
      <div class="profile-section">
        <h2>Account Details</h2>
        <div class="info-group">
          <div class="info-row">
            <span class="label">User</span>
            <span class="value font-bold">{{ currentUser?.username }}</span>
          </div>
          <div class="info-row">
            <span class="label">Access Level</span>
            <span class="value">Admin (Partner)</span>
          </div>
        </div>
      </div>

      <div class="profile-section">
        <h2>Vault Statistics</h2>
        <div class="stats-grid">
          <div class="stat-box">
            <span class="stat-number">{{ totalMemories }}</span>
            <span class="stat-label">Total Memories</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">{{ imageCount }}</span>
            <span class="stat-label">Photos</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">{{ videoCount }}</span>
            <span class="stat-label">Videos</span>
          </div>
        </div>
      </div>

      <div class="profile-section">
        <h2>Quick Actions</h2>
        <div class="settings-actions">
          <button class="btn-outline" @click="router.push('/upload')">Upload New Memories</button>
          <button class="btn-outline" @click="router.push('/categories')">Manage Collections</button>
          <button class="btn-outline text-red" @click="authStore.logout()">Sign Out</button>
        </div>
      </div>

      <div class="profile-section">
        <h2>Danger Zone</h2>
        <div class="settings-actions">
          <button class="btn-outline text-red" @click="resetSystem">Full System Reset</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  padding: 120px 4% 60px;
  max-width: 1000px;
  margin: 0 auto;
  min-height: 100vh;
}

.profile-header {
  margin-bottom: 30px;
  border-bottom: 1px solid #333;
  padding-bottom: 10px;
}

.profile-header h1 {
  font-size: 2.5rem;
  font-weight: 400;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.profile-section h2 {
  font-size: 1.2rem;
  color: #999;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.info-group {
  background: #1f1f1f;
  border-radius: 8px;
  padding: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #333;
}
.info-row:last-child {
  border-bottom: none;
}

.label {
  color: #ccc;
}
.value {
  color: #fff;
}
.font-bold {
  font-weight: bold;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.stat-box {
  background: #1f1f1f;
  padding: 30px;
  border-radius: 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-number {
  font-size: 3rem;
  font-weight: bold;
  color: #e50914;
}

.stat-label {
  color: #999;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 1px;
}

.settings-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 300px;
}

.btn-outline {
  background: transparent;
  border: 1px solid #999;
  color: #ccc;
  padding: 12px 20px;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.btn-outline:hover {
  border-color: #fff;
  color: #fff;
}

.text-red {
  color: #e50914;
  border-color: #e50914;
}
.text-red:hover {
  background: #e50914;
  color: #fff;
}
</style>
