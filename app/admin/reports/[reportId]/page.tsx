import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";

type ReportDetailPageProps = {
  params: Promise<{
    reportId: string;
  }>;
};

type RelatedStudent = {
  full_name: string;
  grade_level: string | null;
};

type RelatedTutor = {
  full_name: string;
  email: string;
};

type RelatedPeriod = {
  name: string;
};

type RawReport = {
  id: string;
  submitted_at: string;
  improved_skills: string;
  achieved_goals: string;
  next_goals: string;
  additional_notes: string | null;
  students: RelatedStudent | RelatedStudent[] | null;
  profiles: RelatedTutor | RelatedTutor[] | null;
  report_periods: RelatedPeriod | RelatedPeriod[] | null;
};

function single<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export default async function AdminReportDetailPage({
  params,
}: ReportDetailPageProps) {
  const { reportId } = await params;
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

  const { data } = await supabase
    .from("reports")
    .select(`
      id,
      submitted_at,
      improved_skills,
      achieved_goals,
      next_goals,
      additional_notes,
      students (
        full_name,
        grade_level
      ),
      profiles (
        full_name,
        email
      ),
      report_periods (
        name
      )
    `)
    .eq("id", reportId)
    .single();

  if (!data) {
    redirect("/admin/reports");
  }

  const report = data as unknown as RawReport;
  const student = single(report.students);
  const tutor = single(report.profiles);
  const period = single(report.report_periods);

  return (
    <AdminShell
      title="Rapportage bekijken"
      subtitle="Volledige inhoud van de ingediende rapportage."
      userLabel={`${profile.full_name} · ${profile.role}`}
    >
      <div className="mb-4">
        <Link
          href="/admin/reports"
          className="text-sm font-medium text-slate-600"
        >
          ← Terug naar rapportages
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="border-b border-slate-200 pb-5">
          <h2 className="text-xl font-semibold text-slate-900">
            Maandelijkse Progressie Formulier
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {student?.full_name ?? "Onbekende leerling"} ·{" "}
            {period?.name ?? "Onbekende periode"}
          </p>
        </div>

        <div className="mt-6 grid gap-5">
          <div>
            <p className="text-sm font-medium text-slate-500">E-mailadres</p>
            <p className="mt-1 text-slate-900">{tutor?.email ?? "-"}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              Voor- en achternaam begeleider
            </p>
            <p className="mt-1 text-slate-900">{tutor?.full_name ?? "-"}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              Voor- en achternaam leerling
            </p>
            <p className="mt-1 text-slate-900">{student?.full_name ?? "-"}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              Leerjaar leerling
            </p>
            <p className="mt-1 text-slate-900">
              {student?.grade_level ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">Maand</p>
            <p className="mt-1 text-slate-900">{period?.name ?? "-"}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              Verbeterde vaardigheden
            </p>
            <p className="mt-1 whitespace-pre-wrap text-slate-900">
              {report.improved_skills}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              Behaalde doelen
            </p>
            <p className="mt-1 whitespace-pre-wrap text-slate-900">
              {report.achieved_goals}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              Doelstellingen volgende maand
            </p>
            <p className="mt-1 whitespace-pre-wrap text-slate-900">
              {report.next_goals}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              Overige opmerkingen
            </p>
            <p className="mt-1 whitespace-pre-wrap text-slate-900">
              {report.additional_notes ?? "-"}
            </p>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
