import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/logout-button";
import { ReportForm } from "@/components/forms/report-form";

type NewReportPageProps = {
  searchParams: Promise<{
    studentId?: string;
    error?: string;
  }>;
};

type StudentOption = {
  id: string;
  full_name: string;
  grade_level: string | null;
  status: string;
  reporting_required: boolean;
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

export default async function NewReportPage({
  searchParams,
}: NewReportPageProps) {
  const { studentId, error } = await searchParams;

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

  const { data: studentLinks } = await supabase
    .from("student_tutors")
    .select(`
      students (
        id,
        full_name,
        grade_level,
        status,
        reporting_required
      )
    `)
    .eq("tutor_id", user.id)
    .eq("is_responsible", true);

  const students =
    (studentLinks
      ?.flatMap((link) => link.students ?? [])
      .filter(
        (student) =>
          student.status === "active" && student.reporting_required === true
      ) ?? []) as StudentOption[];

  if (students.length === 0) {
    redirect("/docent");
  }

  if (!activePeriod) {
    return (
      <main className="min-h-screen bg-slate-100">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                010 op niveau
              </p>
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
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Geen actieve rapportageperiode
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Een admin moet eerst een rapportageperiode activeren.
            </p>
          </div>
        </div>
      </main>
    );
  }

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

        <ReportForm
          students={students}
          selectedStudentId={studentId}
          tutorName={profile.full_name}
          tutorEmail={user.email ?? ""}
          periodName={activePeriod.name}
          deadline={activePeriod.deadline}
          errorMessage={getErrorMessage(error)}
        />
      </div>
    </main>
  );
}
