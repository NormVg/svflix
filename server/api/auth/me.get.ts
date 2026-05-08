import { getCurrentUser } from "../../utils/auth";

export default defineEventHandler((event) => {
  const session = getCurrentUser(event);
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Not logged in." });
  }

  return {
    username: session.username,
    expiresAt: session.exp,
  };
});
