import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
const client = new S3Client({
  region: "auto",
  endpoint: "https://s3.bucket0.com",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || '',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || '',
  },
});
client.send(new GetObjectCommand({ Bucket: process.env.BUCKET0_BUCKET, Key: "temp/watch-together-1778280342493.mp4" }))
  .then(res => console.log("Success:", res.ContentType, res.ContentLength))
  .catch(console.error);
