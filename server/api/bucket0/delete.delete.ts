import { deleteObject, handleBucket0Error } from "../../utils/bucket0";

type DeleteBody = {
  key?: string;
};

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    let key = typeof query.key === "string" ? query.key.trim() : "";

    if (!key) {
      const body = await readBody<DeleteBody>(event).catch(() => ({}));
      key = body.key?.trim() || "";
    }

    if (!key) {
      throw createError({ statusCode: 400, statusMessage: "Key is required (query or body)." });
    }

    return await deleteObject(event, key);
  } catch (error) {
    handleBucket0Error(error);
  }
});
