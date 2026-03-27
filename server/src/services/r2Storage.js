import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;

export async function uploadToR2(key, buffer, mimeType) {
  await R2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }));
}

export async function getSignedDownloadUrl(key, fileName) {
  return getSignedUrl(R2, new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${fileName}"`,
  }), { expiresIn: 3600 }); // 1 hour
}

export async function deleteFromR2(key) {
  await R2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
