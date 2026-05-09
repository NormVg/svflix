import { listAgentBucketFiles, deleteAgentBucketFile } from "../../utils/agentBucket";
import { db } from "../../db/client";
import { 
  appUsers, 
  categories, 
  mediaItems, 
  mediaNotes, 
  mediaCategories, 
  loveNotes 
} from "../../db/schema";
import { requireUser } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  // Only allow logged in users to reset
  requireUser(event);

  try {
    // 1. Reset AgentBucket
    const files = await listAgentBucketFiles();
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.key) {
          await deleteAgentBucketFile(file.key);
        }
      }
    }

    // 2. Reset Database (Delete in order to satisfy foreign keys)
    await db.delete(mediaCategories);
    await db.delete(mediaNotes);
    await db.delete(loveNotes);
    await db.delete(mediaItems);
    await db.delete(categories);
    await db.delete(appUsers);

    // 3. Re-seed from ENV
    const usersRaw = process.env.APP_AUTH_USERS || "";
    const usernames = usersRaw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    const titleize = (value: string) =>
      value
        .replace(/[._-]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());

    if (usernames.length > 0) {
      await db.insert(appUsers).values(
        usernames.map((username) => ({
          username,
          displayName: titleize(username),
        }))
      );
    }

    await db.insert(categories).values([
      { slug: "dates", name: "Dates", description: "Date memories and outings" },
      { slug: "travel", name: "Travel", description: "Trips and vacations" },
      { slug: "daily-life", name: "Daily Life", description: "Everyday moments" },
      { slug: "special-days", name: "Special Days", description: "Birthdays and celebrations" },
    ]);

    return { 
      success: true, 
      message: "System reset complete. Bucket cleared, DB wiped and re-seeded from ENV.",
      usersSeeded: usernames.length
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Reset failed: ${error.message}`,
    });
  }
});
