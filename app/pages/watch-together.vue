<script setup lang="ts">
import { useWatchTogetherStore } from '../stores/watchTogether'
import { useMediaStore } from '../stores/media'
import { useAuthStore } from '../stores/auth'

const store = useWatchTogetherStore()
const mediaStore = useMediaStore()
const authStore = useAuthStore()
const router = useRouter()

onMounted(async () => {
  if (!authStore.currentUser) {
    await authStore.checkAuth()
    if (!authStore.currentUser) { router.push('/'); return }
  }
  await store.initialize()
})
onUnmounted(() => store.cleanup())

// ── Video element ─────────────────────────────────────────────────────────
const videoRef = ref<HTMLVideoElement | null>(null)
watch(videoRef, (el) => { if (el) store.attachVideo(el) })
const videoUrl = ref<string | null>(null)

watch(() => store.videoKey, async (key) => {
  if (key) {
    try {
      videoUrl.value = await mediaStore.loadMediaBlob(key)
    } catch (e) {
      console.error('Failed to load video blob:', e)
      videoUrl.value = null
    }
  } else {
    videoUrl.value = null
  }
}, { immediate: true })

// ── Upload ────────────────────────────────────────────────────────────────
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadError = ref<string | null>(null)

const handleFileSelect = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 700 * 1024 * 1024) { uploadError.value = 'Max 700 MB'; return }

  uploading.value = true; uploadError.value = null; uploadProgress.value = 0
  try {
    const { key: agentKey } = await $fetch<{ key: string }>("/api/bucket0/agent-key");
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4'
    const finalKey = `temp/watch-together-${Date.now()}.${ext}`

    const form = new FormData()
    form.append('file', file)
    form.append('filename', finalKey)

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', 'https://bucket0.com/api/agent-bucket/files/upload')
      xhr.setRequestHeader('Authorization', `Bearer ${agentKey}`)
      
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          uploadProgress.value = Math.round((ev.loaded / ev.total) * 100)
        }
      }
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const r = JSON.parse(xhr.responseText)
          store.createRoom(r.key || finalKey)
          resolve()
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`))
        }
      }
      
      xhr.onerror = () => reject(new Error('Network error'))
      xhr.send(form)
    })
  } catch (err) {
    uploadError.value = (err as Error).message
  } finally {
    uploading.value = false; uploadProgress.value = 0
  }
}

// ── Custom controls ───────────────────────────────────────────────────────
const showControls = ref(true)
let idleTimer: ReturnType<typeof setTimeout>
const resetIdle = () => {
  showControls.value = true; clearTimeout(idleTimer)
  idleTimer = setTimeout(() => { showControls.value = false }, 3500)
}
onMounted(() => window.addEventListener('mousemove', resetIdle))
onUnmounted(() => { window.removeEventListener('mousemove', resetIdle); clearTimeout(idleTimer) })

const currentTime = ref(0)
const duration = ref(0)
const isPaused = ref(true)
const onTimeUpdate = () => { currentTime.value = videoRef.value?.currentTime ?? 0; isPaused.value = videoRef.value?.paused ?? true }
const onLoadedMetadata = () => { duration.value = videoRef.value?.duration ?? 0 }
const togglePlay = () => videoRef.value?.paused ? videoRef.value.play() : videoRef.value?.pause()
const seek = (e: Event) => { if (videoRef.value) videoRef.value.currentTime = parseFloat((e.target as HTMLInputElement).value) }
const formatTime = (s: number) => { if (isNaN(s)) return '0:00'; return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}` }
const toggleFullscreen = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()

// Buffering state for UI
const isBuffering = ref(false)
onMounted(() => {
  store.$onAction(({ name, args }) => {
    if (name === 'applyRemote' && args[0] === 'buffering') {
      isBuffering.value = true
    } else if (name === 'applyRemote' && (args[0] === 'play' || args[0] === 'sync')) {
      isBuffering.value = false
    }
  })
})
</script>

<template>
  <div class="wt-page" @mousemove="resetIdle">

    <!-- ── CONNECTING ──────────────────────────────────────────────────── -->
    <div v-if="store.status === 'connecting'" class="center-screen">
      <div class="spinner"></div>
      <p class="muted">Connecting to Ably...</p>
    </div>

    <!-- ── ERROR ──────────────────────────────────────────────────────── -->
    <div v-else-if="store.status === 'error'" class="center-screen">
      <div class="error-box">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        <p>{{ store.errorMessage }}</p>
        <button class="btn-primary" @click="store.cleanup().then(() => store.initialize())">Retry</button>
      </div>
    </div>

    <!-- ── LOBBY ───────────────────────────────────────────────────────── -->
    <div v-else-if="store.status === 'lobby'" class="lobby">
      <div class="lobby-bg"></div>
      <button class="back-btn" @click="store.cleanup().then(() => router.push('/'))">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
      </button>
      <div class="lobby-content">
        <div class="lobby-logo">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/></svg>
          Watch Together
        </div>

        <!-- Join card: shown when a host room exists -->
        <div v-if="store.availableRoom" class="join-card">
          <div class="join-icon">🎬</div>
          <div class="join-info">
            <h2>Room by <strong>{{ store.availableRoom.host }}</strong></h2>
            <p>A session is waiting for you to join.</p>
          </div>
          <button class="btn-primary" @click="store.joinRoom()">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 17l5-5-5-5v10z"/></svg>
            Join Session
          </button>
        </div>

        <div v-if="store.availableRoom" class="divider"><span>or</span></div>

        <!-- Resume recent card -->
        <div v-if="store.recentFileKey && !store.availableRoom" class="recent-card" @click="store.createRoom(store.recentFileKey)">
          <div class="card-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg></div>
          <div class="card-info">
            <h2>Resume Recent Video</h2>
            <p>Use the last uploaded file to start a new room.</p>
          </div>
          <button class="btn-primary small">Start Room</button>
        </div>

        <div v-if="store.recentFileKey && !store.availableRoom" class="divider"><span>or</span></div>

        <!-- Create card -->
        <label class="create-card" :class="{ uploading }">
          <div class="card-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg></div>
          <div class="card-info">
            <h2>Create Room</h2>
            <p>Upload a video (max 700 MB) and invite your partner.</p>
          </div>
          <input v-if="!uploading" type="file" accept="video/*" @change="handleFileSelect" class="file-input" />
          <div v-if="uploading" class="progress-wrap">
            <div class="progress-bar"><div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div></div>
            <span>{{ uploadProgress }}%</span>
          </div>
          <div v-if="uploadError" class="err-text">{{ uploadError }}</div>
        </label>
      </div>
    </div>

    <!-- ── PLAYER (hosting or watching) ────────────────────────────────── -->
    <div v-else-if="store.status === 'hosting' || store.status === 'watching'" class="player-wrap">
      <!-- Back button overlay -->
      <button class="player-back-btn" @click="store.myRole === 'host' ? store.cancelRoom().then(() => router.push('/')) : store.leaveRoom().then(() => router.push('/'))">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
      </button>
      <video
        ref="videoRef"
        :src="videoUrl ? videoUrl : undefined"
        class="player-video"
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onLoadedMetadata"
        preload="auto"
        playsinline
      ></video>

      <!-- Waiting overlay (host: waiting for guest / guest: buffering) -->
      <Transition name="fade">
        <div v-if="store.status === 'hosting' || isBuffering" class="overlay-msg">
          <div class="spinner"></div>
          <p v-if="isBuffering">Your partner is buffering...</p>
          <p v-else-if="!store.partnerName">Waiting for your partner to join...</p>
          <p v-else>Loading video...</p>
          <button v-if="store.status === 'hosting'" class="btn-danger" @click="store.cancelRoom()">Cancel Room</button>
        </div>
      </Transition>

      <!-- Controls (watching) -->
      <Transition name="controls-fade">
        <div v-if="store.status === 'watching' && (showControls || isPaused)" class="controls">
          <div class="controls-inner">
            <div class="seek-row">
              <span class="t">{{ formatTime(currentTime) }}</span>
              <input type="range" class="seek-bar" min="0" :max="duration" step="0.1" :value="currentTime" @input="seek" />
              <span class="t">{{ formatTime(duration) }}</span>
            </div>
            <div class="btn-row">
              <button class="ctrl-btn" @click="togglePlay">
                <svg v-if="isPaused" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              </button>
              <div class="partner-badge" v-if="store.partnerName">
                👥 {{ store.partnerName }}
              </div>
              <button class="btn-sync" @click="store.requestSync()">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
                Sync to Me
              </button>
              <button class="btn-danger small" @click="store.leaveRoom()" style="margin-left:auto">Leave</button>
              <button class="ctrl-btn" @click="toggleFullscreen">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>

  </div>
</template>

<style scoped>
.wt-page {
  position: fixed; inset: 0; background: #000;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #fff; overflow: hidden;
}

/* Center screens */
.center-screen {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;
}
.spinner {
  width: 44px; height: 44px;
  border: 3px solid rgba(255,255,255,0.1); border-top-color: #e50914;
  border-radius: 50%; animation: spin 0.9s linear infinite;
}
.muted { color: #666; font-size: 0.95rem; }
.error-box {
  background: rgba(229,9,20,0.12); border: 1px solid rgba(229,9,20,0.4);
  border-radius: 16px; padding: 28px 36px; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 16px; max-width: 400px;
}
.error-box svg { width: 40px; height: 40px; color: #e50914; }
.error-box p { color: #ff9090; margin: 0; }

/* Lobby */
.lobby { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
.lobby-bg {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 30% 40%, #1a0a0a 0%, #000 70%);
}
.back-btn {
  position: absolute; top: 20px; left: 20px; z-index: 10;
  background: rgba(255,255,255,0.08); border: none; color: #fff;
  width: 44px; height: 44px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.2s;
}
.back-btn:hover { background: rgba(255,255,255,0.18); }
.back-btn svg { width: 22px; height: 22px; }

.player-back-btn {
  position: absolute; top: 20px; left: 20px; z-index: 20;
  background: rgba(0,0,0,0.5); border: none; color: #fff;
  width: 44px; height: 44px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.2s, opacity 0.3s;
  opacity: 0.7;
}
.player-back-btn:hover { background: rgba(0,0,0,0.8); opacity: 1; }
.player-back-btn svg { width: 22px; height: 22px; }

.lobby-content {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center; gap: 24px;
  width: 100%; max-width: 560px; padding: 0 24px;
}
.lobby-logo {
  display: flex; align-items: center; gap: 12px;
  font-size: 2.2rem; font-weight: 800; letter-spacing: -0.5px;
}
.lobby-logo svg { width: 44px; height: 44px; color: #e50914; }

/* Join card */
.join-card {
  width: 100%;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14);
  border-radius: 20px; padding: 24px 28px;
  display: flex; align-items: center; gap: 20px;
  animation: slideIn 0.4s cubic-bezier(0.2, 0, 0, 1);
}
.join-icon { font-size: 2rem; }
.join-info { flex: 1; }
.join-info h2 { margin: 0 0 4px; font-size: 1.1rem; font-weight: 600; }
.join-info h2 strong { color: #fff; }
.join-info p { margin: 0; color: #777; font-size: 0.88rem; }

/* Divider */
.divider {
  width: 100%; display: flex; align-items: center; gap: 12px; color: #444; font-size: 0.85rem;
}
.divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #2a2a2a; }

/* Create card */
.create-card {
  width: 100%;
  background: rgba(255,255,255,0.04); border: 1px dashed rgba(255,255,255,0.15);
  border-radius: 20px; padding: 24px 28px;
  display: flex; align-items: center; gap: 20px;
  cursor: pointer; position: relative; overflow: hidden;
  transition: border-color 0.2s, background 0.2s;
}
.create-card:hover { border-color: rgba(229,9,20,0.5); background: rgba(229,9,20,0.06); }
.card-icon {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: rgba(229,9,20,0.15); display: flex; align-items: center; justify-content: center;
}
.card-icon svg { width: 26px; height: 26px; color: #e50914; }
.card-info { flex: 1; }
.card-info h2 { margin: 0 0 4px; font-size: 1.1rem; font-weight: 600; }
.card-info p { margin: 0; color: #777; font-size: 0.88rem; }
.file-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.progress-wrap { display: flex; flex-direction: column; gap: 6px; min-width: 120px; }
.progress-bar { height: 5px; background: rgba(255,255,255,0.1); border-radius: 99px; overflow: hidden; }
.progress-fill { height: 100%; background: #e50914; border-radius: 99px; transition: width 0.3s; }
.progress-wrap span { font-size: 0.8rem; color: #888; text-align: center; }
.err-text { font-size: 0.8rem; color: #ff6b6b; }

/* Buttons */
.recent-card {
  width: 100%;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px; padding: 20px 24px;
  display: flex; align-items: center; gap: 20px;
  cursor: pointer; transition: all 0.2s;
}
.recent-card:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
.recent-card .btn-primary.small { padding: 8px 16px; font-size: 0.85rem; }

.btn-primary {
  display: flex; align-items: center; gap: 8px;
  background: #e50914; border: none; color: #fff;
  padding: 12px 22px; border-radius: 8px; font-size: 0.95rem; font-weight: 600;
  cursor: pointer; white-space: nowrap; transition: background 0.2s, transform 0.15s; flex-shrink: 0;
}
.btn-primary svg { width: 18px; height: 18px; }
.btn-primary:hover { background: #f40612; transform: scale(1.03); }

.btn-sync {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-sync:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}
.btn-sync svg { width: 16px; height: 16px; }

.btn-danger {
  background: rgba(229,9,20,0.8); border: none; color: #fff;
  padding: 12px 22px; border-radius: 8px; font-size: 0.9rem; font-weight: 600;
  cursor: pointer; transition: background 0.2s;
}
.btn-danger:hover { background: #e50914; }
.btn-danger.small { padding: 8px 16px; font-size: 0.85rem; }

/* Player */
.player-wrap { position: absolute; inset: 0; background: #000; }
.player-video { width: 100%; height: 100%; object-fit: contain; display: block; }

/* Waiting overlay */
.overlay-msg {
  position: absolute; inset: 0; z-index: 20;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;
  background: rgba(0,0,0,0.75); backdrop-filter: blur(6px);
}
.overlay-msg p { color: #999; font-size: 1rem; margin: 0; }

/* Controls */
.controls {
  position: absolute; bottom: 0; left: 0; right: 0; z-index: 30;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%);
  padding: 60px 4% 28px;
}
.controls-inner { display: flex; flex-direction: column; gap: 12px; }
.seek-row { display: flex; align-items: center; gap: 12px; }
.t { font-size: 0.82rem; color: rgba(255,255,255,0.65); font-variant-numeric: tabular-nums; min-width: 3.5ch; }
.seek-bar { flex: 1; appearance: none; height: 4px; background: rgba(255,255,255,0.3); border-radius: 99px; cursor: pointer; accent-color: #e50914; }
.seek-bar:hover { height: 6px; }
.btn-row { display: flex; align-items: center; gap: 14px; }
.ctrl-btn {
  background: rgba(255,255,255,0.1); border: none; color: #fff;
  width: 46px; height: 46px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.2s, transform 0.15s;
}
.ctrl-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.08); }
.ctrl-btn svg { width: 22px; height: 22px; }
.partner-badge { font-size: 0.88rem; color: rgba(255,255,255,0.65); }

/* Animations */
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.controls-fade-enter-active, .controls-fade-leave-active { transition: opacity 0.3s; }
.controls-fade-enter-from, .controls-fade-leave-to { opacity: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes slideIn { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: none; } }
</style>
