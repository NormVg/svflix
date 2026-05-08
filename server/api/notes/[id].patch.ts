import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { loveNotes } from "../../db/schema";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Note id required." });

  await db.update(loveNotes).set({ isRead: "true" }).where(eq(loveNotes.id, id));

  return { success: true };
});
