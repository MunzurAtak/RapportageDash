import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/logout-button";

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
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
          <div>
            <p className="text-sm font-medium text-slate-500">010 op niveau</p>
            <h1 className="text-xl font-semibold text-slate-900">
              Admin dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <p className="text-sm text-slate-600">
              {profile.full_name} · {profile.role}
            </p>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-8 py-8">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Verwachte rapportages</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">0</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Ingeleverd</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">0</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Ontbreekt</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">0</p>
          </div>
        </div>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Actielijst ontbrekende rapportages
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Hier komt straks automatisch te staan welke leerlingen nog geen
            rapportage hebben.
          </p>
        </section>
      </div>
    </main>
  );
}
