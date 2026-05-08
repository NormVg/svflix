import { eq } from "drizzle-orm";
import { db } from "../../../../db/client";
import { mediaItems, mediaNotes } from "../../../../db/schema";
import { requireDbUser } from "../../../../utils/db-auth";

type Body = { body?: string };

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Media id is required." });
  }

  const payload = await readBody<Body>(event);
  const noteBody = payload.body?.trim() || "";
  if (!noteBody) {
    throw createError({ statusCode: 400, statusMessage: "Note body is required." });
  }

  const user = await requireDbUser(event);
  const [item] = await db.select({ id: mediaItems.id }).from(mediaItems).where(eq(mediaItems.id, id)).limit(1);
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: "Media item not found." });
  }

  const [note] = await db
    .insert(mediaNotes)
    .values({
      mediaItemId: id,
      authorUserId: user.id,
      body: noteBody,
    })
    .returning();

  return note;
});
