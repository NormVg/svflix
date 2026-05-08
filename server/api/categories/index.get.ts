import { asc } from "drizzle-orm";
import { db } from "../../db/client";
import { categories } from "../../db/schema";

export default defineEventHandler(async () => {
  const rows = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.name));

  return { categories: rows };
});
