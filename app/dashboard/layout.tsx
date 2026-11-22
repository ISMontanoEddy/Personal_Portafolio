import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Pre-fetch items for global Command Palette (Ctrl+K)
  const [{ data: projects }, { data: instances }] = await Promise.all([
    supabase.from("projects").select("*").order("name"),
    supabase.from("supabase_instances").select("*").order("name"),
  ]);

  return (
    <DashboardShell
      userEmail={user.email}
      projects={projects || []}
      supabaseInstances={instances || []}
    >
      {children}
    </DashboardShell>
  );
}
