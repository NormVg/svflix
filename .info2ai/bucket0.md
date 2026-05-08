# Bucket0 S3 API — Integration Guide for AI Agents

## What this is

Bucket0's **S3-compatible API** lets AI agents (Claude, GPT, Gemini, OpenClaw, etc.) read and write files using standard AWS SDKs. It speaks the S3 protocol so any S3 client works — boto3, AWS CLI, AWS SDK for JavaScript, rclone, cyberduck, etc.

The user creates an access key in the Bucket0 dashboard and gives you the credentials. You authenticate with AWS Signature v4 (handled automatically by any S3 SDK).

## How it works

1. **User creates a key** in the dashboard → S3 API tab → "Create Key". An Access Key ID and Secret Access Key are generated. The secret is shown only once.
2. **User gives you the credentials** along with a bucket name (or you can list/create buckets via the API).
3. **You use any S3 SDK** with the Bucket0 endpoint and the user's credentials.
4. **Files are stored** in the specified bucket and counted against the user's plan storage.

## Endpoint

```
https://s3.bucket0.com
```

| Setting | Value |
|---|---|
| Endpoint URL | `https://s3.bucket0.com` |
| Region | `auto` |
| Force path style | `true` (recommended) |
| Authentication | AWS Signature v4 |

## Operations

### AWS CLI

```bash
# One-time: configure a profile
aws configure --profile bucket0
# Access Key ID: <ACCESS_KEY_ID>
# Secret Access Key: <SECRET_ACCESS_KEY>
# Region: auto
# Output format: json

# Upload a file
aws s3 cp <LOCAL_PATH> s3://<BUCKET>/<KEY> \
  --endpoint-url https://s3.bucket0.com --profile bucket0

# List bucket contents
aws s3 ls s3://<BUCKET>/ \
  --endpoint-url https://s3.bucket0.com --profile bucket0

# Download a file
aws s3 cp s3://<BUCKET>/<KEY> <LOCAL_PATH> \
  --endpoint-url https://s3.bucket0.com --profile bucket0

# Delete a file
aws s3 rm s3://<BUCKET>/<KEY> \
  --endpoint-url https://s3.bucket0.com --profile bucket0
```

### Python (boto3)

```python
import boto3

s3 = boto3.client(
    "s3",
    endpoint_url="https://s3.bucket0.com",
    aws_access_key_id="<ACCESS_KEY_ID>",
    aws_secret_access_key="<SECRET_ACCESS_KEY>",
    region_name="auto",
)

# Upload
s3.upload_file("<LOCAL_PATH>", "<BUCKET>", "<KEY>")

# Download
s3.download_file("<BUCKET>", "<KEY>", "<LOCAL_PATH>")

# List
response = s3.list_objects_v2(Bucket="<BUCKET>")
for obj in response.get("Contents", []):
    print(obj["Key"], obj["Size"])

# Delete
s3.delete_object(Bucket="<BUCKET>", Key="<KEY>")
```

### JavaScript / TypeScript (AWS SDK v3)

```typescript
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { readFileSync } from "fs";

const s3 = new S3Client({
  region: "auto",
  endpoint: "https://s3.bucket0.com",
  credentials: {
    accessKeyId: "<ACCESS_KEY_ID>",
    secretAccessKey: "<SECRET_ACCESS_KEY>",
  },
  forcePathStyle: true,
});

// Upload
await s3.send(new PutObjectCommand({
  Bucket: "<BUCKET>",
  Key: "<KEY>",
  Body: readFileSync("<LOCAL_PATH>"),
}));

// List
const list = await s3.send(new ListObjectsV2Command({ Bucket: "<BUCKET>" }));
for (const obj of list.Contents ?? []) {
  console.log(obj.Key, obj.Size);
}

// Delete
await s3.send(new DeleteObjectCommand({ Bucket: "<BUCKET>", Key: "<KEY>" }));
```

## Key naming rules

- Use forward slashes for "folder" paths: `<folder>/<subfolder>/<filename>.<ext>`
- Always include the correct file extension matching the content type
- Avoid special characters; stick to letters, digits, `.`, `_`, `-`, `/`
- Keys are case-sensitive
- Maximum key length: 1024 bytes

## Buckets

- The user creates buckets via the dashboard (or you can create them via `PutBucket` if your key has permission)
- Bucket names are globally unique per user
- Use bucket names as logical project/topic separators (e.g., one bucket per project)

## Error handling

Standard S3 error codes apply. Common ones to handle:

| HTTP | S3 Error | What to do |
|---|---|---|
| 200 | — | Success |
| 400 | `InvalidRequest`, `MalformedXML` | Fix the request |
| 401 | `InvalidAccessKeyId` | Stop. Ask user for new credentials |
| 403 | `SignatureDoesNotMatch`, `AccessDenied` | Wrong secret or no permission |
| 404 | `NoSuchBucket`, `NoSuchKey` | Resource doesn't exist |
| 409 | `BucketAlreadyExists` | Use a different bucket name |
| 413 | `EntityTooLarge` | File exceeds plan's per-file limit |
| 429 | `SlowDown` | Back off and retry |
| 500 | `InternalError` | Retry with backoff |
| 507 | `InsufficientStorage` | User hit plan storage limit |

Most S3 SDKs handle retries and backoff automatically.

## Best practices for agents

1. **Tell the user the bucket and key** before uploading
2. **Confirm after upload** with the actual key you used
3. **Use multipart upload for large files** (most SDKs do this automatically for files > 5MB)
4. **Don't delete the user's files** unless explicitly asked
5. **Use consistent key prefixes** within a session: `<topic>/<date>/<filename>`
6. **Use the correct file extension** matching the content type — never invent extensions
7. **Handle 401/403 gracefully** — stop immediately and ask the user for new credentials
8. **Respect storage limits** — if you get a 507, tell the user; don't retry

## Plan limits

| Plan | Max access keys | Max buckets | Max storage | Max file size |
|---|---|---|---|---|
| Free | 1 | 1 | 5 GB | 1 GB |
| Starter | 5 | 10 | 150 GB | 5 GB |
| Pro | 5 | 50 | 700 GB | 15 GB |
| Scale | 5 | 100 | 2 TB | 15 GB |

## Compatible tools

Anything that speaks S3 will work:
- AWS CLI, AWS SDKs (Python, JS, Go, Java, .NET, Ruby, PHP)
- rclone, s3cmd, mc (MinIO client)
- Cyberduck, Transmit, S3 Browser
- Any S3-compatible library
