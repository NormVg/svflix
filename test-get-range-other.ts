import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
const client = new S3Client({
  region: "auto",
  endpoint: "https://s3.bucket0.com",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || '',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || '',
  },
});
async function run() {
  const list = await client.send(new ListObjectsV2Command({ Bucket: process.env.BUCKET0_BUCKET, Prefix: "uploads/" }));
  const key = list.Contents?.find(c => c.Key?.endsWith(".mp4"))?.Key;
  if (!key) return console.log("No video found");
  console.log("Found:", key);
  await client.send(new GetObjectCommand({ Bucket: process.env.BUCKET0_BUCKET, Key: key, Range: "bytes=0-10000" }))
    .then(res => console.log("Success:", res.ContentType, res.ContentLength))
    .catch(err => console.error("Error on range:", err.message));
}
run();
