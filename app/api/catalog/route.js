import { NextResponse } from "next/server";
import { loadCatalog, supabaseConfigured } from "@/lib/supabase-catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Supabase is not configured yet." }, { status: 503 });
  try {
    return NextResponse.json(await loadCatalog({ publicOnly: true }));
  } catch (catalogError) {
    return NextResponse.json({ error: catalogError.message || "Could not load the catalog." }, { status: 502 });
  }
}
