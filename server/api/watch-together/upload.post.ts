import { createBucket0Client, handleBucket0Error } from '../../utils/bucket0'
import { getCurrentUser } from '../../utils/auth'
import { PutObjectCommand } from '@aws-sdk/client-s3'

const TEMP_KEY_PREFIX = 'temp/watch-together'

export default defineEventHandler(async (event) => {
  try {
    const session = getCurrentUser(event)
    if (!session) {
      throw createError({ statusCode: 401, statusMessage: 'Not logged in.' })
    }

    const formData = await readMultipartFormData(event)
    if (!formData || !formData.length) {
      throw createError({ statusCode: 400, statusMessage: 'No multipart form data found.' })
    }

    const filePart = formData.find((p) => p.name === 'file')
    if (!filePart?.data || !filePart.filename) {
      throw createError({ statusCode: 400, statusMessage: 'Missing required video file.' })
    }

    const ext = filePart.filename.split('.').pop()?.toLowerCase() || 'mp4'
    const key = `${TEMP_KEY_PREFIX}-${Date.now()}.${ext}`

    const { client, bucket } = createBucket0Client(event)

    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: filePart.data,
      ContentType: filePart.type || 'video/mp4',
    }))

    return { success: true, key }
  } catch (error) {
    handleBucket0Error(error)
  }
})
