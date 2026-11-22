import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds timeout limit on Vercel

/**
 * Vercel Cron Endpoint: Keep-Alive for all registered Supabase instances
 * Scheduled via vercel.json: every 3 days at 12:00 UTC ("0 12 * / 3 * *")
 * Protected by Authorization: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Validate Cron authorization
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      const urlToken = request.nextUrl.searchParams.get("token");
      if (urlToken !== cronSecret) {
        return NextResponse.json(
          { error: "Unauthorized: Invalid or missing CRON_SECRET" },
          { status: 401 }
        );
      }
    }

    const adminSupabase = createAdminClient();

    // Fetch all registered Supabase instances
    const { data: instances, error: fetchError } = await adminSupabase
      .from("supabase_instances")
      .select("*");

    if (fetchError) {
      console.error("[CRON KEEP-ALIVE] DB fetch error:", fetchError);
      return NextResponse.json(
        { error: "Database error fetching instances", details: fetchError.message },
        { status: 500 }
      );
    }

    if (!instances || instances.length === 0) {
      return NextResponse.json({
        message: "No registered Supabase instances found",
        processed: 0,
      });
    }

    // Ping all instances in parallel
    const results = await Promise.allSettled(
      instances.map(async (instance) => {
        const startTime = Date.now();
        const tableName = instance.keep_alive_table || "_keep_alive";
        // Construct PostgREST endpoint
        const targetUrl = `${instance.supabase_url.replace(/\/+$/, "")}/rest/v1/${tableName}?select=*&limit=1`;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout

          const response = await fetch(targetUrl, {
            method: "GET",
            headers: {
              apikey: instance.anon_key,
              Authorization: `Bearer ${instance.anon_key}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
            cache: "no-store",
          });

          clearTimeout(timeoutId);
          const responseTimeMs = Date.now() - startTime;
          const isHealthy = response.ok;
          const status = isHealthy ? "healthy" : "unhealthy";
          const errorMsg = !isHealthy
            ? `HTTP ${response.status}: ${response.statusText}`
            : null;

          // Update record in central DB
          await adminSupabase
            .from("supabase_instances")
            .update({
              last_ping_at: new Date().toISOString(),
              last_status: status,
              last_response_time_ms: responseTimeMs,
              last_error: errorMsg,
            })
            .eq("id", instance.id);

          return {
            id: instance.id,
            name: instance.name,
            project_ref: instance.project_ref,
            status,
            responseTimeMs,
            error: errorMsg,
          };
        } catch (pingErr: any) {
          const responseTimeMs = Date.now() - startTime;
          const errorMsg = pingErr.name === "AbortError" ? "Timeout (8s)" : pingErr.message;

          await adminSupabase
            .from("supabase_instances")
            .update({
              last_ping_at: new Date().toISOString(),
              last_status: "error",
              last_response_time_ms: responseTimeMs,
              last_error: errorMsg,
            })
            .eq("id", instance.id);

          return {
            id: instance.id,
            name: instance.name,
            project_ref: instance.project_ref,
            status: "error",
            responseTimeMs,
            error: errorMsg,
          };
        }
      })
    );

    const formattedResults = results.map((r) =>
      r.status === "fulfilled" ? r.value : { status: "error", error: r.reason }
    );

    return NextResponse.json({
      success: true,
      executed_at: new Date().toISOString(),
      total: instances.length,
      healthy: formattedResults.filter((r: any) => r.status === "healthy").length,
      results: formattedResults,
    });
  } catch (err: any) {
    console.error("[CRON KEEP-ALIVE] Unexpected fatal error:", err);
    return NextResponse.json(
      { error: "Internal server error during keep-alive ping", message: err.message },
      { status: 500 }
    );
  }
}
