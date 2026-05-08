import { and, eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { mediaItems } from "../../../db/schema";
import { requireDbUser } from "../../../utils/db-auth";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Media id is required." });
  }

  const user = await requireDbUser(event);

  const [deleted] = await db
    .delete(mediaItems)
    .where(and(eq(mediaItems.id, id), eq(mediaItems.ownerUserId, user.id)))
    .returning();

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: "Media item not found for this user." });
  }

  return { deleted: true, item: deleted };
});
