import "server-only";

import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

let client;

export function r2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

function getClient() {
  if (!r2Configured()) throw new Error("Cloudflare R2 is not configured.");
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
      }
    });
  }
  return client;
}

function safeSegment(value, fallback) {
  const cleaned = String(value ?? "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/(^-|-$)/g, "");
  return cleaned || fallback;
}

function extensionFor(contentType) {
  return { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" }[contentType];
}

export async function uploadImage({ contentType, fileSize, scope, ownerId, body }) {
  if (!IMAGE_TYPES.has(contentType)) throw new Error("Use a JPG, PNG, WebP, or AVIF image.");
  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_IMAGE_BYTES) throw new Error("Each image must be 10 MB or smaller.");

  const folder = scope === "colorways" ? "colorways" : "products";
  const key = `${folder}/${safeSegment(ownerId, "draft")}/${crypto.randomUUID()}.${extensionFor(contentType)}`;
  await getClient().send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType
  }));
  return { objectKey: key, publicUrl: imageDeliveryPath(key) };
}

export function imageDeliveryPath(objectKey) {
  return `/api/images/${objectKey.split("/").map(encodeURIComponent).join("/")}`;
}

export async function getImage(objectKey) {
  const result = await getClient().send(new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: objectKey }));
  const body = await result.Body.transformToByteArray();
  return {
    body,
    contentType: result.ContentType || "application/octet-stream",
    etag: result.ETag,
    cacheControl: result.CacheControl || "public, max-age=3600"
  };
}

export async function deleteImages(objectKeys) {
  const uniqueKeys = [...new Set(objectKeys.filter((key) => typeof key === "string" && key.length > 0))];
  if (!uniqueKeys.length) return;
  await getClient().send(new DeleteObjectsCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Delete: { Objects: uniqueKeys.map((Key) => ({ Key })), Quiet: true }
  }));
}
