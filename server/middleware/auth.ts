import { requireUser } from "../utils/auth";

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname;

  const requiresAuth =
    path.startsWith("/api/bucket0") ||
    path.startsWith("/api/categories") ||
    path.startsWith("/api/media");

  if (!requiresAuth) {
    return;
  }

  requireUser(event);
});
