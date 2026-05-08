import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import type { H3Event } from "h3";

const ENDPOINT = "https://s3.bucket0.com";
const REGION = "auto";

const toSafeNumber = (value: number | undefined) => value ?? 0;

const mapS3Error = (error: unknown) => {
  const maybe = error as { name?: string; message?: string; $metadata?: { httpStatusCode?: number } };
  const statusCode = maybe?.$metadata?.httpStatusCode ?? 500;
  const name = maybe?.name ?? "Bucket0Error";
  const message = maybe?.message ?? "Bucket0 request failed";

  return { statusCode, name, message };
};

export const getBucket0Config = (event: H3Event) => {
  const config = useRuntimeConfig(event);
  const accessKeyId = config.bucket0AccessKeyId || process.env.ACCESS_KEY_ID;
  const secretAccessKey = config.bucket0SecretAccessKey || process.env.SECRET_ACCESS_KEY;
  const bucket = config.bucket0Bucket || process.env.BUCKET0_BUCKET;

  if (!accessKeyId || !secretAccessKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Bucket0 credentials are missing. Set ACCESS_KEY_ID and SECRET_ACCESS_KEY.",
    });
  }

  if (!bucket) {
    throw createError({
      statusCode: 500,
      statusMessage: "Bucket0 bucket is missing. Set BUCKET0_BUCKET.",
    });
  }

  return { accessKeyId, secretAccessKey, bucket };
};

export const createBucket0Client = (event: H3Event) => {
  const { accessKeyId, secretAccessKey, bucket } = getBucket0Config(event);

  const client = new S3Client({
    region: REGION,
    endpoint: ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return { client, bucket };
};

export const listBucketObjects = async (event: H3Event, prefix?: string) => {
  const { client, bucket } = createBucket0Client(event);

  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix || undefined,
    }),
  );

  const objects = (response.Contents ?? []).map((item) => ({
    key: item.Key ?? "",
    size: toSafeNumber(item.Size),
    lastModified: item.LastModified?.toISOString() ?? null,
    etag: item.ETag ?? null,
  }));

  const totalBytes = objects.reduce((sum, item) => sum + item.size, 0);

  return {
    bucket,
    prefix: prefix ?? "",
    count: objects.length,
    totalBytes,
    objects,
  };
};

export const uploadObject = async (event: H3Event, key: string, body: Buffer, contentType?: string) => {
  const { client, bucket } = createBucket0Client(event);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType || "application/octet-stream",
    }),
  );

  return { bucket, key, size: body.length };
};

export const getObject = async (event: H3Event, key: string, range?: string) => {
  const { client, bucket } = createBucket0Client(event);

  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      Range: range,
    }),
  );

  return { bucket, key, response };
};

export const deleteObject = async (event: H3Event, key: string) => {
  const { client, bucket } = createBucket0Client(event);

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  return { bucket, key, deleted: true };
};

export const handleBucket0Error = (error: unknown) => {
  if ((error as { statusCode?: number })?.statusCode) {
    throw error;
  }

  const mapped = mapS3Error(error);
  throw createError({
    statusCode: mapped.statusCode,
    statusMessage: `${mapped.name}: ${mapped.message}`,
  });
};
