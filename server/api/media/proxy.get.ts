import { getAgentKey, handleAgentBucketError } from "../../utils/agentBucket";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const key = query.key as string;

  if (!key) {
    throw createError({ statusCode: 400, statusMessage: "Key is required" });
  }

  try {
    const token = getAgentKey();
    const response = await fetch(
      `https://bucket0.com/api/agent-bucket/files/download?key=${encodeURIComponent(key)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
      throw createError({ statusCode: response.status, statusMessage: "Failed to fetch from AgentBucket" });
    }

    // Proxy the headers
    const contentType = response.headers.get("content-type");
    if (contentType) setHeader(event, "Content-Type", contentType);
    
    const contentLength = response.headers.get("content-length");
    if (contentLength) setHeader(event, "Content-Length", contentLength);

    const contentDisposition = response.headers.get("content-disposition");
    if (contentDisposition) setHeader(event, "Content-Disposition", contentDisposition);

    return response.body;
  } catch (error) {
    handleAgentBucketError(error);
  }
});
