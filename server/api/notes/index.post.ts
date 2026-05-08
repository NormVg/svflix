import { db } from "../../db/client";
import { loveNotes } from "../../db/schema";
import { requireDbUser } from "../../utils/db-auth";

type Body = {
  body?: string;
  mediaItemId?: string | null;
};

export default defineEventHandler(async (event) => {
  const user = await requireDbUser(event);
  const { body, mediaItemId } = await readBody<Body>(event);

  if (!body?.trim()) {
    throw createError({ statusCode: 400, statusMessage: "Note body is required." });
  }

  const [created] = await db
    .insert(loveNotes)
    .values({
      authorUserId: user.id,
      body: body.trim(),
      mediaItemId: mediaItemId || null,
    })
    .returning();

  return created;
});
