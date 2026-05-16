import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "admin" && profile.role !== "coordinator") {
    redirect("/docent");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm text-slate-500">Ingelogd als {profile.full_name}</p>

        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Admin dashboard
        </h1>

        <p className="mt-2 text-slate-600">
          Hier komt straks het overzicht van ontbrekende rapportages.
        </p>
      </div>
    </main>
  );
}
