import { and, eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { mediaItems } from "../../../db/schema";
import { requireDbUser } from "../../../utils/db-auth";
import { deleteObject, handleBucket0Error } from "../../../utils/bucket0";

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

    // Also delete from S3 bucket
    if (deleted.bucketKey) {
      await deleteObject(event, deleted.bucketKey);
    }

    return { deleted: true, item: deleted };
  } catch (error) {
    handleBucket0Error(error);
  }
});
