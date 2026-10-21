import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteImages } from "@/lib/r2";
import { deleteProduct, loadCatalog, saveProduct, saveTaxonomy, supabaseConfigured } from "@/lib/supabase-catalog";

export const dynamic = "force-dynamic";

function error(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function authorize() {
  return isAdminAuthenticated();
}

export async function GET() {
  if (!(await authorize())) return error("Admin authentication required.", 401);
  if (!supabaseConfigured()) return error("Supabase is not configured yet.", 503);
  try {
    return NextResponse.json(await loadCatalog());
  } catch (catalogError) {
    return error(catalogError.message || "Could not load the catalog from Supabase.", 502);
  }
}

export async function PUT(request) {
  if (!(await authorize())) return error("Admin authentication required.", 401);
  if (!supabaseConfigured()) return error("Supabase is not configured yet.", 503);
  try {
    const product = await saveProduct(await request.json());
    return NextResponse.json({ product });
  } catch (catalogError) {
    return error(catalogError.message || "Could not save the item to Supabase.", 502);
  }
}

export async function POST(request) {
  if (!(await authorize())) return error("Admin authentication required.", 401);
  if (!supabaseConfigured()) return error("Supabase is not configured yet.", 503);
  try {
    const { type, name } = await request.json();
    const row = await saveTaxonomy(type, name);
    return NextResponse.json({ name: row.name });
  } catch (catalogError) {
    return error(catalogError.message || "Could not save the catalog option to Supabase.", 502);
  }
}

export async function DELETE(request) {
  if (!(await authorize())) return error("Admin authentication required.", 401);
  if (!supabaseConfigured()) return error("Supabase is not configured yet.", 503);
  try {
    const { id } = await request.json();
    const objectKeys = await deleteProduct(id);
    let cleanupWarning = "";
    if (objectKeys.length) {
      try {
        await deleteImages(objectKeys);
      } catch {
        cleanupWarning = "The database item was deleted, but some R2 files could not be removed.";
      }
    }
    return NextResponse.json({ deleted: true, cleanupWarning });
  } catch (catalogError) {
    return error(catalogError.message || "Could not delete the item from Supabase.", 502);
  }
}
