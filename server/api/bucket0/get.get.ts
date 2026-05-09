import { handleBucket0Error, getObject } from "../../utils/bucket0";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const key = typeof query.key === "string" ? query.key.trim() : "";

    if (!key) {
      throw createError({ statusCode: 400, statusMessage: "Query param 'key' is required." });
    }

    // Intentionally DO NOT pass the Range header to getObject. 
    // The s3.bucket0.com proxy modifies headers which breaks the AWS V4 signature 
    // if Range is included in the signed headers, resulting in a 403 Access Denied.
    const result = await getObject(event, key);
    const body = result.response.Body;

    if (!body) {
      throw createError({ statusCode: 404, statusMessage: "File body not found for key." });
    }

    const headers: Record<string, string> = {
      "content-type": result.response.ContentType || "application/octet-stream",
      "accept-ranges": "bytes",
      "cache-control": "public, max-age=31536000",
    };

    if (result.response.ContentLength) {
      headers["content-length"] = result.response.ContentLength.toString();
    }

    // Force download if explicitly requested
    if (query.download) {
      headers["content-disposition"] = `attachment; filename="${key.split("/").pop() || "download"}"`;
    }

    return new Response(body.transformToWebStream(), { headers });
  } catch (error) {
    handleBucket0Error(error);
  }
});
