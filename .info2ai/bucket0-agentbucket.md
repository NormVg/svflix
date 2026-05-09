# Bucket0 AgentBucket — Integration Guide for AI Agents

## What this is

Bucket0 AgentBucket is a **persistent file storage tool** for AI agents (Claude, GPT, Gemini, OpenClaw, etc.). Use it when you need to save files for the user that should outlive the current conversation or session.

You interact with it via a simple HTTP API using a Bearer token. The user creates the API key once in their Bucket0 dashboard and gives it to you.

## When to use AgentBucket

Use it whenever you produce a file the user might want to keep, share, or reference later:

- **Generated documents**: PDFs, reports, summaries, transcripts
- **Scraped or fetched data**: JSON, CSV, HTML, datasets
- **Code or scripts**: Python, JS, SQL, Bash you wrote for the user
- **Logs and outputs**: pipeline runs, analysis results, debug traces
- **Media you generated**: charts, images, audio, video
- **Drafts**: emails, blog posts, meeting notes, documentation

Don't use it for:
- Temporary files needed only within the current task (use your own scratch space)
- Secrets, credentials, or PII you weren't asked to store
- Files larger than the user's plan limit (check the error response)

## How it works

1. **User creates a key** in the Bucket0 dashboard → AgentBucket tab → "New Key". The key looks like `b0ak_...` and is shown only once.
2. **User configures the destination** for that key (per-key setting):
   - **AgentBucket** (default): Files go to a review tab where the user can move them to their main drive later. Use this when the user hasn't explicitly approved you to write to their drive.
   - **My Drive**: Files go directly into the user's drive, optionally into a folder the user specifies. Use this for trusted agents the user has set up for direct writes.
3. **User gives you the key**. You use it as a Bearer token in the `Authorization` header.
4. **You upload files** with paths and filenames you choose. The user reviews them in the dashboard.

You don't choose the destination at upload time — the user controls that via the key's settings.

## Authentication

Every request needs:

```
Authorization: Bearer <YOUR_KEY>
```

Where `<YOUR_KEY>` is the value the user gave you (it starts with `b0ak_`).

Base URL: `https://bucket0.com/api/agent-bucket`

Keys can be deactivated or revoked by the user at any time. If you get a 401, the key is invalid, expired, or revoked — stop using it and ask the user for a new one.

## Operations

### Upload a file

`POST /api/agent-bucket/files/upload`

Multipart form upload. Use slashes in `filename` to put files in folders — folders are auto-created.

```bash
curl -X POST https://bucket0.com/api/agent-bucket/files/upload \
  -H "Authorization: Bearer <YOUR_KEY>" \
  -F "file=@<LOCAL_PATH>" \
  -F "filename=<FOLDER>/<FILENAME>.<EXT>"
```

**Response:**
```json
{
  "success": true,
  "key": "<FOLDER>/<FILENAME>.<EXT>",
  "fileName": "<FILENAME>.<EXT>",
  "size": <BYTES>,
  "destination": "agent"
}
```

The `destination` field tells you where the file actually landed (`agent` or `drive`) so you can mention it to the user.

### Create an empty folder

`POST /api/agent-bucket/files/folder`

Optional — only needed if you want to create a folder before any files exist in it. Uploading to a nested path auto-creates folders.

```bash
curl -X POST https://bucket0.com/api/agent-bucket/files/folder \
  -H "Authorization: Bearer <YOUR_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"path": "<FOLDER>/<SUBFOLDER>"}'
```

### List files

`GET /api/agent-bucket/files`

Returns files you've uploaded (only AgentBucket files — moved files don't appear).

```bash
curl "https://bucket0.com/api/agent-bucket/files?page=1&pageSize=100" \
  -H "Authorization: Bearer <YOUR_KEY>"
```

**Response shape:**
```json
{
  "files": [
    {
      "key": "<FOLDER>/<FILENAME>.<EXT>",
      "fileName": "<FILENAME>.<EXT>",
      "size": <BYTES>,
      "mimeType": "<MIME_TYPE>",
      "createdAt": "<ISO_TIMESTAMP>"
    }
  ],
  "pagination": { "total": <N>, "page": 1, "pageSize": 100, "hasMore": false }
}
```

### Download a file

`GET /api/agent-bucket/files/download?key=<KEY>`

Returns the raw file bytes. Use this to read back something you uploaded earlier.

```bash
curl "https://bucket0.com/api/agent-bucket/files/download?key=<KEY>" \
  -H "Authorization: Bearer <YOUR_KEY>" \
  -o <LOCAL_PATH>
```

### Delete a file

`DELETE /api/agent-bucket/files?key=<KEY>`

Use sparingly — prefer letting the user clean up. Only delete files you uploaded if the user explicitly asks, or if you uploaded it by mistake.

```bash
curl -X DELETE "https://bucket0.com/api/agent-bucket/files?key=<KEY>" \
  -H "Authorization: Bearer <YOUR_KEY>"
```

## Filename and path rules

- Use forward slashes for paths: `<folder>/<subfolder>/<filename>.<ext>`
- Allowed chars: letters, digits, `.`, `_`, `-`, `/`
- Spaces and special chars are replaced with `_`
- No leading slash
- No `..` (path traversal is blocked)
- Always include the correct file extension matching the file's actual content type

**Naming guidance:**
- Use clear, descriptive names — the user will see these
- Group related files in folders by topic, project, or session
- Include dates when relevant for time-series data
- Use lowercase with hyphens for readability

## Error handling

| Status | What it means | What to do |
|---|---|---|
| 200 | Success | Continue |
| 400 | Bad request (missing field, invalid path) | Fix the request payload |
| 401 | Invalid/expired/revoked key | Stop. Ask the user for a new key |
| 402 | Plan limit hit (file size, total storage, file count) | Tell the user; don't retry |
| 404 | File not found | The file may have been moved or deleted |
| 429 | Rate limit (100 uploads/min) | Back off, retry after a minute |
| 500 | Server error | Retry once; if it persists, tell the user |

## Best practices for agents

1. **Tell the user the path before uploading** so they know where to find it
2. **Confirm after upload** with the actual key returned in the response
3. **Don't spam uploads** — batch related work into one file when possible
4. **Re-use folders** for related sessions instead of creating new top-level folders each time
5. **Don't delete the user's files** unless explicitly asked
6. **Respect the destination setting** — if the key is configured for AgentBucket, the user wants to review before files hit their drive
7. **Read the response `destination` field** to know where the file actually landed and tell the user accordingly
8. **Use the correct file extension** matching the file's content type — never invent extensions or omit them

## Plan limits

| Plan | Max API keys | Max storage | Max file size |
|---|---|---|---|
| Free | 1 | 5 GB | 1 GB |
| Starter | 3 | 150 GB | 5 GB |
| Pro | 5 | 700 GB | 15 GB |
| Scale | 5 | 2 TB | 15 GB |

If an upload returns 402, the user has hit a limit. Tell them which one (the error message specifies) and don't retry until they upgrade or free space.

## Quick example: full workflow

```bash
# 1. (Optional) Create a folder for this session's work
curl -X POST https://bucket0.com/api/agent-bucket/files/folder \
  -H "Authorization: Bearer <YOUR_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"path": "<FOLDER>"}'

# 2. Upload each generated file
curl -X POST https://bucket0.com/api/agent-bucket/files/upload \
  -H "Authorization: Bearer <YOUR_KEY>" \
  -F "file=@<LOCAL_PATH>" \
  -F "filename=<FOLDER>/<FILENAME>.<EXT>"

# 3. Read the response — confirm the returned "key" and "destination"
#    Then tell the user where the files were saved.
```

