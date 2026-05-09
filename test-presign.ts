import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
  const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: process.env.BUCKET0_BUCKET, Key: "temp/watch-together-1778280842498.mp4" }));
  console.log(url);
}
run();
