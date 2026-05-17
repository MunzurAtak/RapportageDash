import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { createTutor } from "../actions";

type NewTutorPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  if (error === "missing-fields") {
    return "Vul alle verplichte velden in.";
  }

  if (error === "invalid-role") {
    return "Ongeldige rol gekozen.";
  }

  if (error === "create-user-failed") {
    return "Gebruiker kon niet worden aangemaakt. Controleer of het e-mailadres al bestaat.";
  }

  if (error === "profile-update-failed") {
    return "Account is aangemaakt, maar profiel kon niet worden bijgewerkt.";
  }

  return null;
}

export default async function NewTutorPage({ searchParams }: NewTutorPageProps) {
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
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "admin" && profile.role !== "coordinator") {
    redirect("/docent");
  }

  const errorMessage = getErrorMessage(error);

  return (
    <AdminShell
      title="Nieuwe bijlesdocent"
      subtitle="Maak een nieuw account aan voor een bijlesdocent of personeelslid."
      userLabel={`${profile.full_name} · ${profile.role}`}
    >
      <div className="mb-4">
        <Link href="/admin/tutors" className="text-sm font-medium text-slate-600">
          ← Terug naar bijlesdocenten
        </Link>
      </div>

      <section className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Accountgegevens
        </h2>

        {errorMessage && (
          <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <form action={createTutor} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Voor- en achternaam *
            </label>
            <input
              name="fullName"
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
              placeholder="Bijvoorbeeld: Fatih Demir"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              E-mailadres *
            </label>
            <input
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
              placeholder="naam@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Tijdelijk wachtwoord *
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
              placeholder="Minimaal 8 tekens"
            />
            <p className="mt-2 text-xs text-slate-500">
              De docent kan hiermee inloggen. Later kunnen we wachtwoord-reset
              per e-mail toevoegen.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Rol *
            </label>
            <select
              name="role"
              defaultValue="tutor"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="tutor">Bijlesdocent</option>
              <option value="coordinator">Coördinator</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
            <input type="checkbox" name="active" defaultChecked className="h-4 w-4" />
            <span className="text-sm text-slate-700">Account actief</span>
          </label>

          <button
            type="submit"
            className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Bijlesdocent toevoegen
          </button>
        </form>
      </section>
    </AdminShell>
  );
}
