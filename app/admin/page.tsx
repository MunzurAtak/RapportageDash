import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";

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
    <AdminShell
      title="Home"
      subtitle="Overzicht van rapportages en openstaande acties."
      userLabel={`${profile.full_name} · ${profile.role}`}
    >
      <div className="grid gap-4 md:grid-cols-4">
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

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Compleet</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">0%</p>
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
    </AdminShell>
  );
}
