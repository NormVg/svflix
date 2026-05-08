import { db } from "../../db/client";
import { categories } from "../../db/schema";

type Body = {
  name?: string;
  slug?: string;
  description?: string;
};

const toSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default defineEventHandler(async (event) => {
  const body = await readBody<Body>(event);
  const name = body.name?.trim() || "";
  const slug = toSlug(body.slug || name);

  if (!name || !slug) {
    throw createError({ statusCode: 400, statusMessage: "Name is required." });
  }

  const [created] = await db
    .insert(categories)
    .values({
      name,
      slug,
      description: body.description?.trim() || null,
    })
    .returning();

  return created;
});
