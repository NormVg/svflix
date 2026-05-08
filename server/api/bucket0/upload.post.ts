import { handleBucket0Error, uploadObject } from "../../utils/bucket0";

const buildKey = (providedKey: string | undefined, filename: string) => {
  const safeName = filename.replace(/[^a-zA-Z0-9._/-]/g, "_");
  if (providedKey && providedKey.trim()) {
    const pk = providedKey.trim();
    if (pk.endsWith('/')) {
      return `${pk}${safeName}`;
    }
    return pk;
  }

  const now = new Date().toISOString().slice(0, 10);
  return `uploads/${now}/${safeName}`;
};

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event);
    if (!formData || !formData.length) {
      throw createError({ statusCode: 400, statusMessage: "No multipart form data found." });
    }

    const filePart = formData.find((part) => part.name === "file");
    if (!filePart?.data || !filePart.filename) {
      throw createError({ statusCode: 400, statusMessage: "Missing required file upload." });
    }

    const keyField = formData.find((part) => part.name === "key");
    const keyValue = keyField?.data ? keyField.data.toString("utf-8") : undefined;
    const key = buildKey(keyValue, filePart.filename);

    const uploaded = await uploadObject(event, key, filePart.data, filePart.type);
    return {
      success: true,
      ...uploaded,
      contentType: filePart.type || "application/octet-stream",
    };
  } catch (error) {
    handleBucket0Error(error);
  }
});
