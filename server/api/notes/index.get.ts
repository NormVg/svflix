import { desc, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { loveNotes, appUsers, mediaItems } from "../../db/schema";

export default defineEventHandler(async () => {
  const notes = await db
    .select({
      id: loveNotes.id,
      body: loveNotes.body,
      isRead: loveNotes.isRead,
      createdAt: loveNotes.createdAt,
      authorId: loveNotes.authorUserId,
      authorUsername: appUsers.username,
      authorDisplayName: appUsers.displayName,
      mediaItemId: loveNotes.mediaItemId,
      mediaBucketKey: mediaItems.bucketKey,
      mediaType: mediaItems.mediaType,
      mediaTitle: mediaItems.title,
    })
    .from(loveNotes)
    .leftJoin(appUsers, eq(loveNotes.authorUserId, appUsers.id))
    .leftJoin(mediaItems, eq(loveNotes.mediaItemId, mediaItems.id))
    .orderBy(desc(loveNotes.createdAt));

  return notes;
});
