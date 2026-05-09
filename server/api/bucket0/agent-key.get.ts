import { requireUser } from "../../utils/auth";

export default defineEventHandler((event) => {
  requireUser(event);

  const key = process.env.AGENT_BUCKET_KEY;
  if (!key) {
    throw createError({
      statusCode: 500,
      statusMessage: "AGENT_BUCKET_KEY is missing in .env",
    });
  }

  return { key };
});
