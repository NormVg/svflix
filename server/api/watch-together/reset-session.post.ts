import Ably from 'ably'
import { getCurrentUser } from '../../utils/auth'

const CHANNEL_NAME = 'mediasync:global'

export default defineEventHandler(async (event) => {
  const session = getCurrentUser(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Not logged in.' })
  }

  const apiKey = process.env.ABLY_KEY
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'ABLY_KEY not configured.' })
  }

  try {
    // Use Ably REST (server-side, no connection needed) to:
    // 1. Publish a force-reset event — living clients will hear this and leave
    // 2. Return presence members so the client knows who to wait for
    const rest = new Ably.Rest({ key: apiKey })
    const channel = rest.channels.get(CHANNEL_NAME)

    // Publish force-reset — any connected clients will clean themselves up
    await channel.publish('force-reset', {
      from: 'server',
      reason: 'Manual session reset by admin',
      timestamp: Date.now(),
    })

    // Get current presence so the client knows the state
    const presenceMembers = await channel.presence.get()

    return {
      success: true,
      message: 'Force-reset published. Connected clients will leave.',
      presenceCount: presenceMembers.length,
      members: presenceMembers.map(m => m.clientId),
    }
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to reset session: ${(err as Error).message}`,
    })
  }
})
