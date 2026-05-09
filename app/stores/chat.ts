import { defineStore } from 'pinia'
import * as Ably from 'ably'
import { ChatClient } from '@ably/chat'
import type { Room, Message, TypingSetEvent } from '@ably/chat'
import { useAuthStore } from './auth'
import type { MediaItem } from './media'

export const useChatStore = defineStore('chat', () => {
  const authStore = useAuthStore()

  const isConnected = ref(false)
  const room = ref<Room | null>(null)
  
  // State
  const messages = ref<Message[]>([])
  const typingUsers = ref<Set<string>>(new Set())

  let realtimeClient: Ably.Realtime | null = null
  let chatClient: ChatClient | null = null

  const initialize = async () => {
    // Only connect if we have a logged in user
    if (!authStore.currentUser || realtimeClient) return

    try {
      realtimeClient = new Ably.Realtime({ 
        authUrl: '/api/ably-auth',
        clientId: authStore.currentUser.username
      })

      realtimeClient.connection.on('connected', () => {
        isConnected.value = true
      })

      realtimeClient.connection.on('disconnected', () => {
        isConnected.value = false
      })

      realtimeClient.connection.on('failed', () => {
        isConnected.value = false
      })

      chatClient = new ChatClient(realtimeClient)

      // Get the global room
      const currentRoom = await chatClient.rooms.get('svflix-global', {
        typing: { heartbeatThrottleMs: 5000 },
        presence: { enableEvents: true }
      })
      
      room.value = currentRoom

      // Subscribe to messages
      currentRoom.messages.subscribe((event) => {
        messages.value.push(event.message)
      })

      // Subscribe to typing indicators
      currentRoom.typing.subscribe((event: TypingSetEvent) => {
        typingUsers.value = new Set(event.currentTypers.map(t => t.clientId))
      })

      // Wait until attached to ensure we don't miss messages
      await currentRoom.attach()
      
      // No history fetch — messages are strictly ephemeral in-memory

    } catch (error) {
      console.error('Failed to initialize chat:', error)
    }
  }

  const sendMessage = async (text: string, media?: MediaItem) => {
    if (!room.value || (!text.trim() && !media)) return
    try {
      const payload: any = { text: text.trim() }
      
      if (media) {
        payload.metadata = {
          mediaId: media.id,
          bucketKey: media.bucketKey,
          mediaType: media.mediaType,
          title: media.title || ''
        }
      }

      await room.value.messages.send(payload)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const notifyTyping = async () => {
    if (!room.value) return
    try {
      await room.value.typing.keystroke()
    } catch (error) {
      console.error('Failed to send typing indicator:', error)
    }
  }

  const disconnect = () => {
    if (room.value) {
      room.value.detach()
      room.value = null
    }
    if (realtimeClient) {
      realtimeClient.close()
      realtimeClient = null
    }
    chatClient = null
    isConnected.value = false
    messages.value = []
    typingUsers.value = new Set()
  }

  return {
    isConnected,
    messages,
    typingUsers,
    initialize,
    sendMessage,
    notifyTyping,
    disconnect
  }
})
