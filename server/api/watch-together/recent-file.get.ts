import { listAgentBucketFiles } from '../../utils/agentBucket'
import { getCurrentUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const session = getCurrentUser(event)
    if (!session) {
      throw createError({ statusCode: 401, statusMessage: 'Not logged in.' })
    }

    const files = await listAgentBucketFiles();
    const result = {
      objects: files.filter((f: any) => f.key.startsWith('temp/watch-together-'))
    }
    
    // Sort by createdAt descending to get the most recent one
    const latest = result.objects
      .sort((a: any, b: any) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return timeB - timeA
      })[0]

    if (!latest) return { key: null }
    return { key: latest.key }
  } catch (error) {
    return { key: null }
  }
})
