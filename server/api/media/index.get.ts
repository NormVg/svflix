import { desc, eq, inArray } from "drizzle-orm";
import { db } from "../../db/client";
import { categories, mediaCategories, mediaItems } from "../../db/schema";

export default defineEventHandler(async () => {
  const items = await db
    .select()
    .from(mediaItems)
    .orderBy(desc(mediaItems.createdAt));

  if (!items.length) {
    return { media: [] };
  }

  const mediaIds = items.map((item) => item.id);
  const categoryRows = await db
    .select({
      mediaItemId: mediaCategories.mediaItemId,
      categoryId: categories.id,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(mediaCategories)
    .innerJoin(categories, eq(mediaCategories.categoryId, categories.id))
    .where(inArray(mediaCategories.mediaItemId, mediaIds));

  const byMediaId = new Map<string, Array<{ id: string; name: string; slug: string }>>();
  for (const row of categoryRows) {
    const existing = byMediaId.get(row.mediaItemId) ?? [];
    existing.push({ id: row.categoryId, name: row.categoryName, slug: row.categorySlug });
    byMediaId.set(row.mediaItemId, existing);
  }

  return {
    media: items.map((item) => ({
      ...item,
      categories: byMediaId.get(item.id) ?? [],
    })),
  };
});
