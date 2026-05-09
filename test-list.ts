import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
const client = new S3Client({
  region: "auto",
  endpoint: "https://s3.bucket0.com",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || '',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || '',
  },
});
client.send(new ListObjectsV2Command({ Bucket: process.env.BUCKET0_BUCKET, Prefix: "temp/" }))
  .then(res => console.log(res.Contents?.map(c => c.Key)))
  .catch(console.error);
