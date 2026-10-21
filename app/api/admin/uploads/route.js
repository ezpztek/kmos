import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteImages, r2Configured, uploadImage } from "@/lib/r2";

function error(message, status) {
  return NextResponse.json({ error: message }, { status });
}

function r2UploadError(uploadError) {
  if (uploadError?.name === "AccessDenied" || /access denied/i.test(uploadError?.message ?? "")) {
    return error("Cloudflare R2 denied this upload. Use R2 API credentials with Object Read & Write access to this bucket, confirm the account ID and bucket name, then restart the server.", 502);
  }
  return error(uploadError?.message || "Could not upload the image to Cloudflare R2.", uploadError?.$metadata ? 502 : 400);
}

export async function POST(request) {
  if (!(await isAdminAuthenticated())) return error("Admin authentication required.", 401);
  if (!r2Configured()) return error("Cloudflare R2 is not configured yet. Add the R2 environment variables and restart the server.", 503);
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file.arrayBuffer !== "function") return error("Choose an image to upload.", 400);
    return NextResponse.json(await uploadImage({
      contentType: file.type,
      fileSize: file.size,
      scope: formData.get("scope"),
      ownerId: formData.get("ownerId"),
      body: Buffer.from(await file.arrayBuffer())
    }));
  } catch (uploadError) {
    return r2UploadError(uploadError);
  }
}

export async function DELETE(request) {
  if (!(await isAdminAuthenticated())) return error("Admin authentication required.", 401);
  if (!r2Configured()) return error("Cloudflare R2 is not configured yet.", 503);
  try {
    const body = await request.json();
    if (!Array.isArray(body.objectKeys) || body.objectKeys.length > 100) return error("Provide up to 100 R2 object keys.", 400);
    await deleteImages(body.objectKeys);
    return NextResponse.json({ deleted: body.objectKeys.length });
  } catch (deleteError) {
    return error(deleteError.message || "Could not delete the stored images.", 400);
  }
}
