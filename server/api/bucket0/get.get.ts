import { handleBucket0Error, getObject } from "../../utils/bucket0";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const key = typeof query.key === "string" ? query.key.trim() : "";

    if (!key) {
      throw createError({ statusCode: 400, statusMessage: "Query param 'key' is required." });
    }

    const result = await getObject(event, key);
    const body = result.response.Body;

    if (!body) {
      throw createError({ statusCode: 404, statusMessage: "File body not found for key." });
    }

    const headers = {
      "content-type": result.response.ContentType || "application/octet-stream",
      "content-disposition": `attachment; filename="${key.split("/").pop() || "download"}"`,
      "cache-control": "no-store",
    };

    return new Response(body.transformToWebStream(), { headers });
  } catch (error) {
    handleBucket0Error(error);
  }
});
