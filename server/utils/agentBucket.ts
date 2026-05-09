export const getAgentKey = () => {
  const key = process.env.AGENT_BUCKET_KEY;
  if (!key) {
    throw createError({
      statusCode: 500,
      statusMessage: "AGENT_BUCKET_KEY is missing in .env",
    });
  }
  return key;
};

export const handleAgentBucketError = (error: unknown) => {
  if (error instanceof Error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
  throw createError({
    statusCode: 500,
    statusMessage: "AgentBucket request failed",
  });
};

export const deleteAgentBucketFile = async (key: string) => {
  const token = getAgentKey();
  const res = await fetch(`https://bucket0.com/api/agent-bucket/files?key=${encodeURIComponent(key)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to delete file: ${res.status} ${text}`);
  }
  return true;
};

export const listAgentBucketFiles = async () => {
  const token = getAgentKey();
  const res = await fetch("https://bucket0.com/api/agent-bucket/files?page=1&pageSize=100", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error(`Failed to list files: ${res.status}`);
  }
  const data = await res.json();
  return data.files || [];
};
