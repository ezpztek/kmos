import { getImage, r2Configured } from "@/lib/r2";

export async function GET(_request, { params }) {
  if (!r2Configured()) return new Response("Image storage is not configured.", { status: 503 });
  const { key = [] } = await params;
  const objectKey = key.join("/");
  if (!/^(products|colorways)\/[a-zA-Z0-9/_-]+\.(jpg|png|webp|avif)$/.test(objectKey)) {
    return new Response("Image not found.", { status: 404 });
  }
  try {
    const image = await getImage(objectKey);
    const headers = {
      "content-type": image.contentType,
      "cache-control": image.cacheControl,
      "x-content-type-options": "nosniff"
    };
    if (image.etag) headers.etag = image.etag;
    return new Response(image.body, { status: 200, headers });
  } catch (imageError) {
    if (imageError?.name === "NoSuchKey" || imageError?.$metadata?.httpStatusCode === 404) {
      return new Response("Image not found.", { status: 404 });
    }
    return new Response("Image could not be loaded.", { status: 502 });
  }
}
