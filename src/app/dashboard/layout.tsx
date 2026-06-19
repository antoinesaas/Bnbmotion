import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardTopbar } from "@/components/dashboard/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, credits_remaining")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-background">
      <DashboardTopbar
        fullName={profile?.full_name ?? null}
        email={user.email ?? ""}
        credits={profile?.credits_remaining ?? 0}
      />
      <main className="container-page py-8">{children}</main>
    </div>
  );
}
