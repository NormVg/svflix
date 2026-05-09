<script setup lang="ts">
import { useChatStore } from '../stores/chat'
import { useAuthStore } from '../stores/auth'
import { useMediaStore, type MediaItem } from '../stores/media'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const chatStore = useChatStore()
const mediaStore = useMediaStore()

const inputMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const attachedMedia = ref<MediaItem | null>(null)
const showMediaPicker = ref(false)
const mediaSearch = ref('')

const filteredMedia = computed(() => {
  if (!mediaSearch.value.trim()) return mediaStore.mediaItems.slice(0, 24)
  const q = mediaSearch.value.toLowerCase()
  return mediaStore.mediaItems.filter(m =>
    (m.title || '').toLowerCase().includes(q) ||
    new Date(m.createdAt).toLocaleDateString().includes(q)
  ).slice(0, 24)
})

// Ensure we are logged in before accessing chat
onMounted(async () => {
  if (!authStore.currentUser) {
    await authStore.checkAuth()
    if (!authStore.currentUser) {
      router.push('/login')
      return
    }
  }
  await chatStore.initialize()
})

onUnmounted(() => {
  chatStore.disconnect()
})

// Auto-scroll to bottom when new messages arrive
watch(() => chatStore.messages.length, async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
})

const sendMessage = async () => {
  if (!inputMessage.value.trim() && !attachedMedia.value) return
  const text = inputMessage.value
  const media = attachedMedia.value || undefined
  inputMessage.value = ''
  attachedMedia.value = null
  await chatStore.sendMessage(text, media)
}

const selectMedia = (item: MediaItem) => {
  attachedMedia.value = item
  showMediaPicker.value = false
}

const removeAttachment = () => {
  attachedMedia.value = null
}

const goToMedia = (id: string) => {
  router.push(`/watch/${id}`)
}

const handleTyping = () => {
  chatStore.notifyTyping()
}

const formatTime = (timestamp: Date | number) => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="chat-page">
    <div class="chat-container">
      <div class="chat-header">
        <button class="back-btn" @click="router.push('/')">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        </button>
        <div class="header-info">
          <h1>Global Chat</h1>
          <div class="status">
            <span class="status-dot" :class="{ connected: chatStore.isConnected }"></span>
            <span class="status-text">
              {{ chatStore.isConnected ? 'Connected' : 'Connecting...' }}
            </span>
          </div>
        </div>
      </div>

      <div class="messages-area" ref="messagesContainer">
        <div v-if="chatStore.messages.length === 0 && chatStore.isConnected" class="empty-state">
          No messages yet. Say hello!
        </div>
        
        <div 
          v-for="msg in chatStore.messages" 
          :key="msg.serial" 
          class="message-wrapper"
          :class="{ 'is-mine': msg.clientId === authStore.currentUser?.username }"
        >
          <div class="message-content">
            <div class="message-sender" v-if="msg.clientId !== authStore.currentUser?.username">
              {{ msg.clientId }}
            </div>
            <div class="message-bubble" :class="{ 'has-media': msg.metadata?.mediaId }">
              <div v-if="msg.metadata?.mediaId" class="message-media" @click="goToMedia(msg.metadata.mediaId)">
                <div class="media-preview">
                  <img v-if="msg.metadata.mediaType === 'image'" :src="mediaStore.getMediaUrl(msg.metadata.bucketKey)" alt="Attachment" />
                  <video v-else :src="mediaStore.getMediaUrl(msg.metadata.bucketKey) + '#t=0.1'" muted playsinline></video>
                  <div v-if="msg.metadata.mediaType === 'video'" class="play-icon-overlay">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
                <div v-if="msg.metadata.title" class="media-title">{{ msg.metadata.title }}</div>
              </div>
              <div v-if="msg.text" class="message-text">
                {{ msg.text }}
              </div>
            </div>
            <div class="message-time">
              {{ formatTime(msg.timestamp) }}
            </div>
          </div>
        </div>
      </div>

      <div class="typing-indicator" v-show="chatStore.typingUsers.size > 0">
        <span class="dots">
          <span>.</span><span>.</span><span>.</span>
        </span>
        <span class="typing-text">
          {{ Array.from(chatStore.typingUsers).join(', ') }} {{ chatStore.typingUsers.size === 1 ? 'is' : 'are' }} typing
        </span>
      </div>

      <div class="input-area">
        <!-- Attachment Preview -->
        <Transition name="slide-up">
          <div v-if="attachedMedia" class="attachment-preview">
            <div class="attachment-thumb">
              <img v-if="attachedMedia.mediaType === 'image'" :src="mediaStore.getMediaUrl(attachedMedia.bucketKey)" />
              <video v-else :src="mediaStore.getMediaUrl(attachedMedia.bucketKey) + '#t=0.1'" muted></video>
            </div>
            <div class="attachment-info">
              <span class="attachment-title">{{ attachedMedia.title || 'Attached Media' }}</span>
              <span class="attachment-type">{{ attachedMedia.mediaType }}</span>
            </div>
            <button class="remove-attachment-btn" @click="removeAttachment" title="Remove attachment">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
        </Transition>

        <!-- Media Picker Inline Panel -->
        <Transition name="picker">
          <div class="picker-panel" v-if="showMediaPicker">
            <input
              v-model="mediaSearch"
              class="picker-search"
              placeholder="🔍 Search memories..."
              autofocus
            />
            <div class="picker-grid" v-if="filteredMedia.length > 0">
              <div 
                v-for="item in filteredMedia" 
                :key="item.id" 
                class="picker-cell"
                @click="selectMedia(item)"
              >
                <img v-if="item.mediaType === 'image'" :src="mediaStore.getMediaUrl(item.bucketKey)" class="cell-thumb" />
                <video v-else :src="mediaStore.getMediaUrl(item.bucketKey) + '#t=0.1'" muted class="cell-thumb"></video>
                <div v-if="item.mediaType === 'video'" class="video-indicator">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              No memories found.
            </div>
          </div>
        </Transition>

        <div class="input-controls">
          <button class="attach-btn" @click="showMediaPicker = true" title="Attach Media">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/></svg>
          </button>
          <input 
            v-model="inputMessage" 
            type="text" 
            placeholder="Type a message..." 
            @keyup.enter="sendMessage"
            @input="handleTyping"
            :disabled="!chatStore.isConnected"
          />
          <button class="send-btn" @click="sendMessage" :disabled="(!inputMessage.trim() && !attachedMedia) || !chatStore.isConnected">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
      
    </div>
  </div>
</template>

<style scoped>
.chat-page {
  padding-top: 68px; /* Offset for NavBar */
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #141414;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.chat-header {
  padding: 20px 4%;
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(to bottom, rgba(20,20,20,1) 60%, rgba(20,20,20,0));
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.2s, transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.back-btn svg {
  width: 24px;
  height: 24px;
}

.header-info h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.5px;
}

.status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff3b30;
  transition: background-color 0.3s;
  box-shadow: 0 0 8px rgba(255, 59, 48, 0.6);
}

.status-dot.connected {
  background: #34c759;
  box-shadow: 0 0 8px rgba(52, 199, 89, 0.6);
}

.status-text {
  font-size: 0.85rem;
  color: #aaa;
  font-weight: 500;
}

.messages-area {
  flex: 1;
  padding: 100px 4% 120px 4%; /* Top padding for header, bottom padding for input */
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  scroll-behavior: smooth;
}

/* Hide scrollbar for cleaner look */
.messages-area::-webkit-scrollbar {
  width: 6px;
}
.messages-area::-webkit-scrollbar-track {
  background: transparent;
}
.messages-area::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

.empty-state {
  margin: auto;
  color: #666;
  font-size: 1.1rem;
  text-align: center;
  font-weight: 500;
}

.message-wrapper {
  display: flex;
  width: 100%;
}

.message-wrapper.is-mine {
  justify-content: flex-end;
}

.message-content {
  max-width: 75%;
  display: flex;
  flex-direction: column;
}

.message-wrapper.is-mine .message-content {
  align-items: flex-end;
}

.message-sender {
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 6px;
  padding: 0 4px;
  font-weight: 500;
}

.message-bubble {
  background: #2b2b2b;
  padding: 12px 18px;
  border-radius: 18px;
  border-top-left-radius: 4px;
  color: #fff;
  font-size: 1rem;
  line-height: 1.5;
  word-wrap: break-word;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.message-bubble.has-media {
  padding: 8px; /* Less padding if there's media to keep it neat */
}

.message-wrapper.is-mine .message-bubble {
  background: #e50914;
  border-top-left-radius: 18px;
  border-top-right-radius: 4px;
}

.message-media {
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 8px;
  background: #111;
}

.media-preview {
  position: relative;
  width: 100%;
  max-height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-preview img,
.media-preview video {
  max-width: 100%;
  max-height: 250px;
  object-fit: contain;
  display: block;
}

.play-icon-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.play-icon-overlay svg {
  width: 24px;
  height: 24px;
  color: #fff;
  margin-left: 2px;
}

.media-title {
  padding: 8px 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #ddd;
  background: rgba(0,0,0,0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-text {
  padding: 0 4px;
}

.message-time {
  font-size: 0.75rem;
  color: #666;
  margin-top: 6px;
  padding: 0 4px;
}

.typing-indicator {
  position: absolute;
  bottom: 90px;
  left: 4%;
  padding: 8px 16px;
  background: rgba(43, 43, 43, 0.9);
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #ccc;
  backdrop-filter: blur(10px);
  z-index: 10;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.dots span {
  animation: typing 1.4s infinite;
  animation-fill-mode: both;
  font-size: 1.2rem;
  line-height: 1;
}

.dots span:nth-child(2) { animation-delay: 0.2s; }
.dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 100% { opacity: 0.2; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-2px); }
}

.input-area {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px 4%;
  background: linear-gradient(to top, rgba(20,20,20,1) 70%, rgba(20,20,20,0));
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 10;
}

.input-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
}

.attach-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.attach-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.attach-btn svg {
  width: 24px;
  height: 24px;
}

.input-area input {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 16px 24px;
  border-radius: 30px;
  color: #fff;
  font-size: 1.05rem;
  outline: none;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.input-area input:focus {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.05);
}

.input-area input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn {
  background: #e50914;
  border: none;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.2s, opacity 0.2s;
  box-shadow: 0 4px 15px rgba(229, 9, 20, 0.4);
}

.send-btn:hover:not(:disabled) {
  background: #f40612;
  transform: scale(1.08);
}

.send-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.2);
  box-shadow: none;
}

.send-btn svg {
  width: 24px;
  height: 24px;
  margin-left: 4px; /* Slight visual offset for the send icon */
}

/* Attachment Preview Styles */
.attachment-preview {
  display: flex;
  align-items: center;
  background: rgba(40, 40, 40, 0.9);
  padding: 8px 12px;
  border-radius: 12px;
  gap: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  backdrop-filter: blur(10px);
  width: fit-content;
  max-width: 100%;
}

.attachment-thumb {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  background: #111;
  flex-shrink: 0;
}

.attachment-thumb img,
.attachment-thumb video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.attachment-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.attachment-title {
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.attachment-type {
  font-size: 0.75rem;
  color: #aaa;
  text-transform: capitalize;
}

.remove-attachment-btn {
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  margin-left: auto;
}

.remove-attachment-btn:hover {
  color: #ff3b30;
}

.remove-attachment-btn svg {
  width: 20px;
  height: 20px;
}

/* Picker panel (Inline) */
.picker-panel {
  background: #1a1812;
  border: 1px solid #35302a;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 8px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.5);
}

.picker-search {
  background: #111;
  border: 1px solid #333;
  color: #fff;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.95rem;
  width: 100%;
  box-sizing: border-box;
}

.picker-search:focus {
  outline: none;
  border-color: #e50914;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
  padding-right: 4px;
}

.picker-grid::-webkit-scrollbar {
  width: 6px;
}
.picker-grid::-webkit-scrollbar-track {
  background: transparent;
}
.picker-grid::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

.picker-cell {
  aspect-ratio: 4/3;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.15s, transform 0.15s;
  position: relative;
}

.picker-cell:hover {
  border-color: #e50914;
  transform: scale(1.04);
}

.cell-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.video-indicator {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: rgba(0,0,0,0.6);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-indicator svg {
  width: 14px;
  height: 14px;
  color: #fff;
  margin-left: 2px;
}

/* Animations */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.picker-enter-active,
.picker-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.picker-enter-from,
.picker-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
