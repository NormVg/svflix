import { and, eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { mediaItems } from "../../../db/schema";
import { requireDbUser } from "../../../utils/db-auth";
import { deleteAgentBucketFile, handleAgentBucketError } from "../../../utils/agentBucket";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Media id is required." });
  }

  const user = await requireDbUser(event);

  try {
    const [deleted] = await db
      .delete(mediaItems)
      .where(and(eq(mediaItems.id, id), eq(mediaItems.ownerUserId, user.id)))
      .returning();

    if (!deleted) {
      throw createError({ statusCode: 404, statusMessage: "Media item not found for this user." });
    }

    // Also delete from AgentBucket
    if (deleted.bucketKey) {
      try {
        await deleteAgentBucketFile(deleted.bucketKey);
      } catch (e) {
        console.error("Failed to delete from AgentBucket (might be an old S3 file):", e);
      }
    }

    return { deleted: true, item: deleted };
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: "Internal server error." });
  }
});
