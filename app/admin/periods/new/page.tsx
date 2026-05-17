import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { createPeriod } from "../actions";

type NewPeriodPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  if (error === "missing-fields") {
    return "Vul alle verplichte velden in.";
  }

  if (error === "insert-failed") {
    return "Periode kon niet worden toegevoegd. Controleer of de naam al bestaat.";
  }

  if (error === "deactivate-failed") {
    return "Bestaande actieve periode kon niet worden gedeactiveerd.";
  }

  return null;
}

export default async function NewPeriodPage({
  searchParams,
}: NewPeriodPageProps) {
  const { error } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, active, approved")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.approved) {
    redirect("/account-inactief?reason=pending");
  }

  if (!profile.active) {
    redirect("/account-inactief?reason=inactive");
  }

  if (profile.role !== "admin" && profile.role !== "coordinator") {
    redirect("/docent");
  }

  const errorMessage = getErrorMessage(error);

  return (
    <AdminShell
      title="Nieuwe periode"
      subtitle="Maak een nieuwe rapportageperiode aan."
      userLabel={`${profile.full_name} · ${profile.role}`}
    >
      <div className="mb-4">
        <Link
          href="/admin/periods"
          className="text-sm font-medium text-slate-600"
        >
          ← Terug naar periodes
        </Link>
      </div>

      <section className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Periodegegevens
        </h2>

        {errorMessage && (
          <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <form action={createPeriod} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Naam periode *
            </label>
            <input
              name="name"
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
              placeholder="Bijvoorbeeld: Juni 2026"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Startdatum *
              </label>
              <input
                name="startDate"
                type="date"
                required
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Einddatum *
              </label>
              <input
                name="endDate"
                type="date"
                required
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Deadline *
            </label>
            <input
              name="deadline"
              type="date"
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
            />
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
            <input type="checkbox" name="active" className="h-4 w-4" />
            <span className="text-sm text-slate-700">
              Deze periode direct actief maken
            </span>
          </label>

          <button
            type="submit"
            className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Periode toevoegen
          </button>
        </form>
      </section>
    </AdminShell>
  );
}
