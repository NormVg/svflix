import { defineStore } from 'pinia'
import * as Ably from 'ably'
import { useAuthStore } from './auth'

const CHANNEL_NAME = 'watch-together:room'

export type RoomStatus = 'idle' | 'connecting' | 'lobby' | 'hosting' | 'watching' | 'error'

export const useWatchTogetherStore = defineStore('watchTogether', () => {
  const authStore = useAuthStore()

  // ── Public state ──────────────────────────────────────────────────────────
  const status = ref<RoomStatus>('idle')
  const videoKey = ref<string | null>(null)
  const partnerName = ref<string | null>(null)
  const errorMessage = ref<string | null>(null)
  // If a host is already present, this holds the joinable room info
  const availableRoom = ref<{ videoKey: string; host: string } | null>(null)
  const recentFileKey = ref<string | null>(null)

  // ── Internals ─────────────────────────────────────────────────────────────
  const selfReady = ref(false)
  const peerReady = ref(false)
  const myRole = ref<'host' | 'guest' | null>(null)
  let realtimeClient: Ably.Realtime | null = null
  let channel: Ably.RealtimeChannel | null = null
  let videoEl: HTMLVideoElement | null = null
  let isSyncing = false
  const setSyncing = () => { isSyncing = true; setTimeout(() => { isSyncing = false }, 500) }
  let pendingSeek: number | null = null

  const publish = async (name: string, data: Record<string, unknown> = {}) => {
    if (!channel) return
    await channel.publish(name, { ...data, from: authStore.currentUser?.username })
  }

  const applyRemote = async (name: string, data: any) => {
    if (!videoEl) { if (name === 'seek') pendingSeek = data.time; return }
    
    setSyncing()
    if (name === 'play') {
      videoEl.currentTime = data.time; await videoEl.play()
    } else if (name === 'pause' || name === 'buffering') {
      videoEl.currentTime = data.time; videoEl.pause()
    } else if (name === 'seek' || name === 'sync') {
      videoEl.currentTime = data.time
      if (!data.paused) await videoEl.play(); else videoEl.pause()
    }
  }

  const checkBothReady = () => {
    if (!selfReady.value || !peerReady.value) return
    status.value = 'watching'
    // Initial sync
    publish('sync', { time: videoEl?.currentTime ?? 0, paused: videoEl?.paused ?? true })
  }

  // ── Initialize: connect and check for existing room ───────────────────────
  const initialize = async () => {
    if (status.value !== 'idle' && status.value !== 'error') return
    status.value = 'connecting'
    errorMessage.value = null

    try {
      realtimeClient = new Ably.Realtime({ authUrl: '/api/ably-auth', authMethod: 'GET' })
      await new Promise<void>((resolve, reject) => {
        realtimeClient!.connection.once('connected', resolve)
        realtimeClient!.connection.once('failed', () => reject(new Error('Ably connection failed')))
      })

      channel = realtimeClient.channels.get(CHANNEL_NAME)
      await channel.attach()

      // ── Global message handler ─────────────────────────────────────────────
      channel.subscribe((msg) => {
        const data = msg.data as any
        const isMine = data?.from === authStore.currentUser?.username

        if (msg.name === 'room-open' && !isMine) {
          // A host just created a room — show join option
          availableRoom.value = { videoKey: data.videoKey, host: data.from }
        }

        if (msg.name === 'room-cancel' && !isMine) {
          // Host cancelled — reset to lobby
          availableRoom.value = null
          videoKey.value = null; myRole.value = null
          selfReady.value = false; peerReady.value = false; partnerName.value = null
          status.value = 'lobby'
        }

        if (msg.name === 'guest-joined' && !isMine && status.value === 'hosting') {
          partnerName.value = data.from
          peerReady.value = true
          // Send sync so guest snaps to current position immediately
          publish('sync', { time: videoEl?.currentTime ?? 0, paused: videoEl?.paused ?? true })
          checkBothReady()
        }

        if (msg.name === 'guest-left' && !isMine) {
          partnerName.value = null; peerReady.value = false
          if (status.value === 'watching') status.value = 'hosting'
        }

        if (msg.name === 'sync' && !isMine) {
          if (!peerReady.value) { peerReady.value = true; checkBothReady() }
          applyRemote('sync', data)
        }

        if (['play', 'pause', 'seek'].includes(msg.name) && !isMine) {
          applyRemote(msg.name, data)
        }
      })

      // ── Check if a room already exists (host in presence) ─────────────────
      await refreshRoomState()

      // ── Check for recent file ─────────────────────────────────────────────
      try {
        const res = await $fetch<{ key: string | null }>('/api/watch-together/recent-file')
        recentFileKey.value = res.key
      } catch {}

      status.value = 'lobby'
    } catch (err) {
      status.value = 'error'
      errorMessage.value = (err as Error).message
    }
  }

  // ── Check presence for an existing host ───────────────────────────────────
  const refreshRoomState = async () => {
    if (!channel) return
    const members = await channel.presence.get()
    const host = members.find(m => (m.data as any)?.role === 'host')
    if (host && host.clientId !== authStore.currentUser?.username) {
      availableRoom.value = { videoKey: (host.data as any).videoKey, host: host.clientId }
    } else {
      availableRoom.value = null
    }
  }

  // ── Host: create room with an uploaded video key ───────────────────────────
  const createRoom = async (key: string) => {
    if (!channel) return
    videoKey.value = key
    myRole.value = 'host'
    await channel.presence.enter({ role: 'host', videoKey: key })
    // Announce to anyone already on the page
    await publish('room-open', { videoKey: key })
    status.value = 'hosting'

    channel.presence.subscribe('leave', (member) => {
      if ((member.data as any)?.role === 'guest') {
        partnerName.value = null; peerReady.value = false
        if (status.value === 'watching') status.value = 'hosting'
      }
    })
  }

  // ── Guest: join an existing room ──────────────────────────────────────────
  const joinRoom = async () => {
    if (!channel || !availableRoom.value) return
    videoKey.value = availableRoom.value.videoKey
    partnerName.value = availableRoom.value.host
    myRole.value = 'guest'
    // Show the player immediately so the video mounts and selfReady can fire
    peerReady.value = true // host is already present and has a loaded video
    status.value = 'hosting' // reuse 'hosting' view while loading; becomes 'watching' on ready
    await channel.presence.enter({ role: 'guest' })
    await publish('guest-joined', {})
  }

  // ── Host: cancel / Guest: leave ───────────────────────────────────────────
  const cancelRoom = async () => {
    await publish('room-cancel', {})
    await cleanup()
  }

  const leaveRoom = async () => {
    await publish('guest-left', {})
    await cleanup()
  }

  // ── Attach video element and wire up sync events ──────────────────────────
  const attachVideo = (el: HTMLVideoElement) => {
    videoEl = el
    el.addEventListener('play', () => {
      if (isSyncing) return
      publish('play', { time: el.currentTime })
    })
    el.addEventListener('pause', () => {
      if (isSyncing) return; publish('pause', { time: el.currentTime })
    })
    el.addEventListener('waiting', () => {
      if (isSyncing) return
      publish('buffering', { time: el.currentTime })
    })
    el.addEventListener('playing', () => {
      if (isSyncing) return
      // When we resume after buffering, tell partner to play too
      publish('play', { time: el.currentTime })
    })
    el.addEventListener('loadedmetadata', () => {
      selfReady.value = true
      if (pendingSeek !== null) { el.currentTime = pendingSeek; pendingSeek = null }
      checkBothReady()
    })
    el.addEventListener('error', () => { errorMessage.value = 'Video failed to load.' })
  }

  // ── Manual Sync ──────────────────────────────────────────────────────────
  const requestSync = () => {
    if (!videoEl) return
    publish('sync', { time: videoEl.currentTime, paused: videoEl.paused })
  }

  // ── Full cleanup ──────────────────────────────────────────────────────────
  const cleanup = async () => {
    videoEl = null; selfReady.value = false; peerReady.value = false; myRole.value = null
    status.value = 'idle'; partnerName.value = null; videoKey.value = null
    errorMessage.value = null; availableRoom.value = null
    if (channel) {
      try { await channel.presence.leave() } catch {}
      channel.unsubscribe(); channel.presence.unsubscribe(); channel = null
    }
    if (realtimeClient) { realtimeClient.close(); realtimeClient = null }
  }

  return {
    status, videoKey, partnerName, availableRoom, recentFileKey, errorMessage, selfReady, peerReady,
    initialize,    attachVideo,
    createRoom,
    joinRoom,
    cancelRoom,
    leaveRoom,
    requestSync,
    cleanup,
    refreshRoomState,
  }
})
