import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Live HTTP Status Check for Project Environments (Prod / Staging)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Valid URL is required" }, { status: 400 });
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        headers: {
          "User-Agent": "DevOps-IDP-StatusCheck/1.0",
        },
      });

      clearTimeout(timeoutId);
      const responseTimeMs = Date.now() - startTime;

      return NextResponse.json({
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        responseTimeMs,
      });
    } catch (headError: any) {
      clearTimeout(timeoutId);
      // Fallback to GET with Range if HEAD is blocked or method not allowed
      try {
        const getController = new AbortController();
        const getTimeoutId = setTimeout(() => getController.abort(), 6000);

        const getResponse = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent": "DevOps-IDP-StatusCheck/1.0",
            Range: "bytes=0-10",
          },
          signal: getController.signal,
        });

        clearTimeout(getTimeoutId);
        const responseTimeMs = Date.now() - startTime;

        return NextResponse.json({
          ok: getResponse.ok,
          status: getResponse.status,
          statusText: getResponse.statusText,
          responseTimeMs,
        });
      } catch (getError: any) {
        const responseTimeMs = Date.now() - startTime;
        return NextResponse.json({
          ok: false,
          status: 0,
          statusText: getError.name === "AbortError" ? "Timeout (6s)" : getError.message,
          responseTimeMs,
        });
      }
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to perform health check", details: error.message },
      { status: 500 }
    );
  }
}
