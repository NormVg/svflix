import { listBucketObjects } from '../../utils/bucket0'
import { getCurrentUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const session = getCurrentUser(event)
    if (!session) {
      throw createError({ statusCode: 401, statusMessage: 'Not logged in.' })
    }

    const result = await listBucketObjects(event, 'temp/watch-together-')
    
    // Sort by lastModified descending to get the most recent one
    const latest = result.objects
      .sort((a, b) => {
        const timeA = a.lastModified ? new Date(a.lastModified).getTime() : 0
        const timeB = b.lastModified ? new Date(b.lastModified).getTime() : 0
        return timeB - timeA
      })[0]

    if (!latest) return { key: null }
    return { key: latest.key }
  } catch (error) {
    return { key: null }
  }
})
