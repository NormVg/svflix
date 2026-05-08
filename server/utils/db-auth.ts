import { eq } from "drizzle-orm";
import type { H3Event } from "h3";
import { db } from "../db/client";
import { appUsers } from "../db/schema";
import { requireUser } from "./auth";

export const requireDbUser = async (event: H3Event) => {
  const sessionUser = requireUser(event);

  const [user] = await db
    .select({
      id: appUsers.id,
      username: appUsers.username,
      displayName: appUsers.displayName,
    })
    .from(appUsers)
    .where(eq(appUsers.username, sessionUser.username))
    .limit(1);

  if (!user) {
    throw createError({
      statusCode: 403,
      statusMessage: "Authenticated user is not provisioned in database.",
    });
  }

  return user;
};
