import { eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { appUsers, mediaItems, mediaNotes } from "../../../db/schema";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Media id is required." });
  }

  const [item] = await db.select().from(mediaItems).where(eq(mediaItems.id, id)).limit(1);
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: "Media item not found." });
  }

  const notes = await db
    .select({
      id: mediaNotes.id,
      body: mediaNotes.body,
      createdAt: mediaNotes.createdAt,
      author: appUsers.username,
    })
    .from(mediaNotes)
    .innerJoin(appUsers, eq(mediaNotes.authorUserId, appUsers.id))
    .where(eq(mediaNotes.mediaItemId, id));

  return { item, notes };
});
