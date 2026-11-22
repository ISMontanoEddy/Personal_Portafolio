import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Generate a signed URL for private APK file download from Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storagePath, expiresIn = 86400 } = await request.json(); // Default 24 hours (86400s)

    if (!storagePath) {
      return NextResponse.json({ error: "storagePath is required" }, { status: 400 });
    }

    const { data, error } = await supabase.storage
      .from("apks")
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to generate signed URL", details: error.message },
      { status: 500 }
    );
  }
}
