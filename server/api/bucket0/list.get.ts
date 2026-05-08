import { handleBucket0Error, listBucketObjects } from "../../utils/bucket0";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const prefix = typeof query.prefix === "string" ? query.prefix : "";
    return await listBucketObjects(event, prefix);
  } catch (error) {
    handleBucket0Error(error);
  }
});
