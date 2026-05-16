import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/logout-button";
import { submitReport } from "../actions";

type ReportPageProps = {
  params: Promise<{
    studentId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  if (error === "missing-fields") {
    return "Vul alle verplichte velden in.";
  }

  if (error === "no-active-period") {
    return "Er is geen actieve rapportageperiode.";
  }

  if (error === "already-submitted") {
    return "Voor deze leerling is al een rapportage ingediend voor de actieve periode.";
  }

  if (error === "insert-failed") {
    return "Rapportage kon niet worden opgeslagen. Probeer opnieuw.";
  }

  return null;
}

export default async function ReportPage({
  params,
  searchParams,
}: ReportPageProps) {
  const { studentId } = await params;
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

  if (profile.role === "admin" || profile.role === "coordinator") {
    redirect("/admin");
  }

  const { data: activePeriod } = await supabase
    .from("report_periods")
    .select("id, name, deadline")
    .eq("active", true)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, status, reporting_required")
    .eq("id", studentId)
    .single();

  if (
    !student ||
    student.status !== "active" ||
    student.reporting_required !== true
  ) {
    redirect("/docent");
  }

  const { data: tutorLink } = await supabase
    .from("student_tutors")
    .select("id")
    .eq("student_id", studentId)
    .eq("tutor_id", user.id)
    .eq("is_responsible", true)
    .maybeSingle();

  if (!tutorLink) {
    redirect("/docent");
  }

  const { data: existingReport } = activePeriod
    ? await supabase
        .from("reports")
        .select("id, submitted_at")
        .eq("student_id", studentId)
        .eq("tutor_id", user.id)
        .eq("period_id", activePeriod.id)
        .maybeSingle()
    : { data: null };

  const errorMessage = getErrorMessage(error);

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
          <div>
            <p className="text-sm font-medium text-slate-500">010 op niveau</p>
            <h1 className="text-xl font-semibold text-slate-900">
              Rapportage invullen
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

      <div className="mx-auto max-w-3xl px-8 py-8">
        <div className="mb-4">
          <Link href="/docent" className="text-sm font-medium text-slate-600">
            ← Terug naar dashboard
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div>
            <p className="text-sm text-slate-500">Leerling</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              {student.full_name}
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Periode:{" "}
              <span className="font-medium">
                {activePeriod?.name ?? "Geen actieve periode"}
              </span>
            </p>

            {activePeriod?.deadline && (
              <p className="mt-1 text-sm text-slate-600">
                Deadline: {activePeriod.deadline}
              </p>
            )}
          </div>

          {errorMessage && (
            <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {!activePeriod && (
            <div className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Er is geen actieve rapportageperiode. Een admin moet eerst een
              periode activeren.
            </div>
          )}

          {existingReport && (
            <div className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              Voor deze leerling is al een rapportage ingediend.
            </div>
          )}

          {activePeriod && !existingReport && (
            <form action={submitReport} className="mt-6 space-y-5">
              <input type="hidden" name="studentId" value={student.id} />

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Welke vaardigheden zijn verbeterd?
                </label>
                <textarea
                  name="improvedSkills"
                  required
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
                  placeholder="Beschrijf kort welke vaardigheden zijn verbeterd."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Welke doelen zijn behaald?
                </label>
                <textarea
                  name="achievedGoals"
                  required
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
                  placeholder="Beschrijf welke doelen de leerling heeft behaald."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Wat zijn de doelen voor de volgende periode?
                </label>
                <textarea
                  name="nextGoals"
                  required
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
                  placeholder="Beschrijf waar de leerling de komende periode aan gaat werken."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Opmerkingen
                </label>
                <textarea
                  name="additionalNotes"
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
                  placeholder="Optioneel: extra opmerkingen voor administratie of ouders."
                />
              </div>

              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
              >
                Rapportage indienen
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
