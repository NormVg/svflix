import { inArray } from "drizzle-orm";
import { db } from "../../db/client";
import { categories, mediaCategories, mediaItems } from "../../db/schema";
import { requireDbUser } from "../../utils/db-auth";

type Body = {
  bucketKey?: string;
  mediaType?: "image" | "video";
  title?: string;
  description?: string;
  capturedAt?: string;
  categoryIds?: string[];
};

export default defineEventHandler(async (event) => {
  const body = await readBody<Body>(event);
  const user = await requireDbUser(event);
  const bucketKey = body.bucketKey?.trim() || "";

  if (!bucketKey) {
    throw createError({ statusCode: 400, statusMessage: "bucketKey is required." });
  }

  const mediaType = body.mediaType === "video" ? "video" : "image";

  const [created] = await db
    .insert(mediaItems)
    .values({
      ownerUserId: user.id,
      bucketKey,
      mediaType,
      title: body.title?.trim() || null,
      description: body.description?.trim() || null,
      capturedAt: body.capturedAt ? new Date(body.capturedAt) : null,
    })
    .returning();

  if (body.categoryIds?.length) {
    const validCategories = await db
      .select({ id: categories.id })
      .from(categories)
      .where(inArray(categories.id, body.categoryIds));

    if (validCategories.length) {
      await db.insert(mediaCategories).values(
        validCategories.map((category) => ({
          mediaItemId: created.id,
          categoryId: category.id,
        })),
      );
    }
  }

  return created;
});
