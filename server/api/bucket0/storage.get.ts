import { handleBucket0Error, listBucketObjects } from "../../utils/bucket0";

export default defineEventHandler(async (event) => {
  try {
    const listing = await listBucketObjects(event);
    return {
      bucket: listing.bucket,
      totalFiles: listing.count,
      totalBytes: listing.totalBytes,
      totalMegabytes: Number((listing.totalBytes / (1024 * 1024)).toFixed(3)),
      objects: listing.objects,
    };
  } catch (error) {
    handleBucket0Error(error);
  }
});
