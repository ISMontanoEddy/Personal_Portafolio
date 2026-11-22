import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Trigger keep-alive ping for one or all registered Supabase instances
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { instanceId } = body;

    let query = supabase.from("supabase_instances").select("*");
    if (instanceId) {
      query = query.eq("id", instanceId);
    }

    const { data: instances, error: fetchErr } = await query;

    if (fetchErr || !instances) {
      return NextResponse.json({ error: fetchErr?.message || "No instances found" }, { status: 400 });
    }

    const pingResults = await Promise.allSettled(
      instances.map(async (inst) => {
        const startTime = Date.now();
        const tableName = inst.keep_alive_table || "_keep_alive";
        const cleanUrl = inst.supabase_url.replace(/\/+$/, "");
        const targetUrl = `${cleanUrl}/rest/v1/${tableName}?select=*&limit=1`;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 7000);

          const response = await fetch(targetUrl, {
            method: "GET",
            headers: {
              apikey: inst.anon_key,
              Authorization: `Bearer ${inst.anon_key}`,
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

          await supabase
            .from("supabase_instances")
            .update({
              last_ping_at: new Date().toISOString(),
              last_status: status,
              last_response_time_ms: responseTimeMs,
              last_error: errorMsg,
            })
            .eq("id", inst.id);

          return {
            id: inst.id,
            status,
            responseTimeMs,
            error: errorMsg,
          };
        } catch (err: any) {
          const responseTimeMs = Date.now() - startTime;
          const errorMsg = err.name === "AbortError" ? "Timeout (7s)" : err.message;

          await supabase
            .from("supabase_instances")
            .update({
              last_ping_at: new Date().toISOString(),
              last_status: "error",
              last_response_time_ms: responseTimeMs,
              last_error: errorMsg,
            })
            .eq("id", inst.id);

          return {
            id: inst.id,
            status: "error",
            responseTimeMs,
            error: errorMsg,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      processed: instances.length,
      results: pingResults,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error during ping execution", details: error.message },
      { status: 500 }
    );
  }
}
