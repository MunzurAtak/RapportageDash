import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { createStudent } from "../actions";

type NewStudentPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  if (error === "missing-fields") {
    return "Vul alle verplichte velden in.";
  }

  if (error === "insert-failed") {
    return "Leerling kon niet worden toegevoegd.";
  }

  if (error === "link-failed") {
    return "Leerling is aangemaakt, maar kon niet aan docent worden gekoppeld.";
  }

  return null;
}

export default async function NewStudentPage({
  searchParams,
}: NewStudentPageProps) {
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

  const { data: tutors } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "tutor")
    .eq("active", true)
    .order("full_name", { ascending: true });

  const errorMessage = getErrorMessage(error);

  return (
    <AdminShell
      title="Nieuwe leerling"
      subtitle="Voeg een leerling toe en wijs direct een verantwoordelijke bijlesdocent toe."
      userLabel={`${profile.full_name} · ${profile.role}`}
    >
      <div className="mb-4">
        <Link
          href="/admin/students"
          className="text-sm font-medium text-slate-600"
        >
          ← Terug naar leerlingen
        </Link>
      </div>

      <section className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Leerlinggegevens
        </h2>

        {errorMessage && (
          <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <form action={createStudent} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Voor- en achternaam leerling *
            </label>
            <input
              name="fullName"
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
              placeholder="Bijvoorbeeld: Ahmed Yilmaz"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Leerjaar leerling *
            </label>
            <input
              name="gradeLevel"
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
              placeholder="Bijvoorbeeld: Groep 8, 2 havo, 4 vwo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Status *
            </label>
            <select
              name="status"
              defaultValue="active"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="active">Actief</option>
              <option value="inactive">Inactief</option>
            </select>
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
            <input
              type="checkbox"
              name="reportingRequired"
              defaultChecked
              className="h-4 w-4"
            />
            <span className="text-sm text-slate-700">
              Rapportageplicht actief
            </span>
          </label>

          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-medium text-slate-900">
              Toegewezen bijlesdocent
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Kies de verantwoordelijke rapportagedocent voor deze leerling.
            </p>

            <select
              name="responsibleTutorId"
              required
              className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="">Selecteer bijlesdocent</option>
              {(tutors ?? []).map((tutor) => (
                <option key={tutor.id} value={tutor.id}>
                  {tutor.full_name} — {tutor.email}
                </option>
              ))}
            </select>

            {(!tutors || tutors.length === 0) && (
              <p className="mt-3 text-sm text-red-700">
                Er zijn nog geen actieve bijlesdocenten. Voeg eerst een
                bijlesdocent toe.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Leerling toevoegen
          </button>
        </form>
      </section>
    </AdminShell>
  );
}
