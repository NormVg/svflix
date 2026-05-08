import { eq, inArray } from "drizzle-orm";
import { db } from "../../../db/client";
import { mediaItems, mediaCategories, categories } from "../../../db/schema";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Media id is required." });
  }

  const body = await readBody(event);
  const { title, description, categoryIds } = body;

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

  if (categoryIds !== undefined && Array.isArray(categoryIds)) {
    // Delete existing categories
    await db.delete(mediaCategories).where(eq(mediaCategories.mediaItemId, id));

    if (categoryIds.length > 0) {
      // Find valid categories
      const validCategories = await db
        .select({ id: categories.id })
        .from(categories)
        .where(inArray(categories.id, categoryIds));

      if (validCategories.length > 0) {
        await db.insert(mediaCategories).values(
          validCategories.map((category) => ({
            mediaItemId: id,
            categoryId: category.id,
          })),
        );
      }
    }
  }

  return { success: true };
});
