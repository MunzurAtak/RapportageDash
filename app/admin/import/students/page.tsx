import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { importStudentsFromCsv } from "./actions";

type ImportStudentsPageProps = {
  searchParams: Promise<{
    error?: string;
    imported?: string;
    created?: string;
    updated?: string;
    linked?: string;
    skipped?: string;
    missingTutors?: string;
  }>;
};

function getErrorMessage(error?: string) {
  if (error === "missing-file") {
    return "Upload een CSV-bestand.";
  }

  if (error === "parse-failed") {
    return "CSV kon niet goed worden gelezen. Controleer of het een TutorBird-export is.";
  }

  if (error === "no-valid-rows") {
    return "Er zijn geen geldige leerlingen gevonden in het CSV-bestand.";
  }

  return null;
}

export default async function ImportStudentsPage({
  searchParams,
}: ImportStudentsPageProps) {
  const params = await searchParams;
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

  const errorMessage = getErrorMessage(params.error);
  const hasResult = Boolean(params.imported);

  const missingTutors = params.missingTutors
    ? params.missingTutors.split(",").filter(Boolean)
    : [];

  return (
    <AdminShell
      title="Leerlingen importeren"
      subtitle="Importeer leerlingen en docentkoppelingen vanuit een TutorBird CSV-export."
      userLabel={`${profile.full_name} - ${profile.role}`}
    >
      <div className="mb-4">
        <Link
          href="/admin/students"
          className="text-sm font-medium text-slate-600"
        >
          &larr; Terug naar leerlingen
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            TutorBird CSV uploaden
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Upload de contactlijst-export uit TutorBird. De app gebruikt alleen
            de leerlingnaam en de kolom Bijlesdocent.
          </p>

          {errorMessage && (
            <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {hasResult && (
            <div className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
              <p className="font-semibold">Import afgerond</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Rijen gelezen: {params.imported}</li>
                <li>Nieuwe leerlingen toegevoegd: {params.created}</li>
                <li>Bestaande leerlingen bijgewerkt: {params.updated}</li>
                <li>Docentkoppelingen aangemaakt: {params.linked}</li>
                <li>Overgeslagen door fouten: {params.skipped}</li>
              </ul>
            </div>
          )}

          {missingTutors.length > 0 && (
            <div className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p className="font-semibold">
                Deze docenten zijn niet gevonden in de app
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {missingTutors.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
              <p className="mt-3">
                Voeg deze docenten eerst toe of controleer of de namen exact
                overeenkomen.
              </p>
            </div>
          )}

          <form action={importStudentsFromCsv} className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                CSV-bestand *
              </label>
              <input
                name="csvFile"
                type="file"
                accept=".csv,text/csv"
                required
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700 sm:w-auto"
            >
              Import starten
            </button>
          </form>
        </section>

        <aside className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <h3 className="font-semibold text-slate-900">Wat wordt gebruikt?</h3>

          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <div>
              <p className="font-medium text-slate-900">Leerlingnaam</p>
              <p>Voornaam + Achternaam</p>
            </div>

            <div>
              <p className="font-medium text-slate-900">Bijlesdocent</p>
              <p>
                De kolom Bijlesdocent wordt gekoppeld aan bestaande gebruikers
                op basis van volledige naam.
              </p>
            </div>

            <div>
              <p className="font-medium text-slate-900">Standaardwaarden</p>
              <p>
                Nieuwe leerlingen worden actief, rapportageplichtig en krijgen
                leerjaar Onbekend.
              </p>
            </div>

            <div>
              <p className="font-medium text-slate-900">Dubbele leerlingen</p>
              <p>
                Leerlingen met dezelfde naam worden niet opnieuw toegevoegd,
                maar bijgewerkt.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
