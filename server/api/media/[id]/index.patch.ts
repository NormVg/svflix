import { eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { mediaItems } from "../../../db/schema";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Media id is required." });
  }

  const body = await readBody(event);
  const { title, description } = body;

  const [item] = await db.select().from(mediaItems).where(eq(mediaItems.id, id)).limit(1);
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: "Media item not found." });
  }

  await db.update(mediaItems)
    .set({
      title: title !== undefined ? title : item.title,
      description: description !== undefined ? description : item.description,
    })
    .where(eq(mediaItems.id, id));

  return { success: true };
});
