import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";

type AdminReportsPageProps = {
  searchParams: Promise<{
    periodId?: string;
    studentId?: string;
    tutorId?: string;
  }>;
};

type RelatedStudent = {
  id: string;
  full_name: string;
  grade_level: string | null;
};

type RelatedTutor = {
  id: string;
  full_name: string;
  email: string;
};

type RelatedPeriod = {
  id: string;
  name: string;
};

type RawReport = {
  id: string;
  submitted_at: string;
  student_id: string;
  tutor_id: string;
  period_id: string;
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

export default async function AdminReportsPage({
  searchParams,
}: AdminReportsPageProps) {
  const { periodId, studentId, tutorId } = await searchParams;

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

  const { data: periods } = await supabase
    .from("report_periods")
    .select("id, name")
    .order("start_date", { ascending: false });

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name")
    .order("full_name", { ascending: true });

  const { data: tutors } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("role", ["tutor", "coordinator", "admin"])
    .order("full_name", { ascending: true });

  let query = supabase
    .from("reports")
    .select(`
      id,
      submitted_at,
      student_id,
      tutor_id,
      period_id,
      students (
        id,
        full_name,
        grade_level
      ),
      profiles!reports_tutor_id_fkey (
        id,
        full_name,
        email
      ),
      report_periods (
        id,
        name
      )
    `)
    .is("deleted_at", null)
    .order("submitted_at", { ascending: false });

  if (periodId) {
    query = query.eq("period_id", periodId);
  }

  if (studentId) {
    query = query.eq("student_id", studentId);
  }

  if (tutorId) {
    query = query.eq("tutor_id", tutorId);
  }

  const { data, error } = await query;

  const reports = (data ?? []) as unknown as RawReport[];

  return (
    <AdminShell
      title="Rapportages"
      subtitle="Bekijk en filter alle ingediende rapportages per leerling, docent en periode."
      userLabel={`${profile.full_name} · ${profile.role}`}
    >
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Filters
        </h2>

        <form className="mt-5 grid gap-4 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Periode
            </label>
            <select
              name="periodId"
              defaultValue={periodId ?? ""}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="">Alle periodes</option>
              {(periods ?? []).map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Leerling
            </label>
            <select
              name="studentId"
              defaultValue={studentId ?? ""}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="">Alle leerlingen</option>
              {(students ?? []).map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Bijlesdocent
            </label>
            <select
              name="tutorId"
              defaultValue={tutorId ?? ""}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="">Alle bijlesdocenten</option>
              {(tutors ?? []).map((tutor) => (
                <option key={tutor.id} value={tutor.id}>
                  {tutor.full_name} — {tutor.email}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 sm:w-auto"
            >
              Filteren
            </button>

            <Link
              href="/admin/reports"
              className="inline-flex w-full justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
            >
              Reset
            </Link>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Ingediende rapportages
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Aantal resultaten: {reports.length}
            </p>
          </div>
        </div>

        {error && (
          <div className="m-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Rapportages konden niet worden opgehaald.
          </div>
        )}

        {/* Mobile cards */}
        <div className="divide-y divide-slate-200 bg-white md:hidden">
          {reports.length === 0 && (
            <div className="px-4 py-5 text-sm text-slate-500">
              Geen rapportages gevonden voor deze filters.
            </div>
          )}

          {reports.map((report) => {
            const student = single(report.students);
            const tutor = single(report.profiles);
            const period = single(report.report_periods);

            return (
              <div key={report.id} className="px-4 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {student?.full_name ?? "Onbekende leerling"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {period?.name ?? "-"}
                    </p>
                  </div>
                </div>

                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Leerjaar</dt>
                    <dd className="text-slate-900">{student?.grade_level ?? "-"}</dd>
                  </div>

                  <div>
                    <dt className="text-slate-500">Ingevuld door</dt>
                    <dd className="text-slate-900">{tutor?.full_name ?? "-"}</dd>
                    <dd className="break-all text-xs text-slate-400">
                      {tutor?.email ?? ""}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500">Ingediend op</dt>
                    <dd className="text-slate-900">
                      {new Date(report.submitted_at).toLocaleDateString("nl-NL", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    href={`/admin/reports/${report.id}`}
                    className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Bekijken
                  </Link>

                  <a
                    href={`/api/reports/${report.id}/pdf`}
                    className="inline-flex justify-center rounded-lg bg-teal-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
                  >
                    PDF
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-600">Leerling</th>
                <th className="px-6 py-3 font-medium text-slate-600">Leerjaar</th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Ingevuld door
                </th>
                <th className="px-6 py-3 font-medium text-slate-600">Periode</th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Ingediend op
                </th>
                <th className="px-6 py-3 font-medium text-slate-600">Actie</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {reports.length === 0 && (
                <tr>
                  <td className="px-6 py-5 text-slate-500" colSpan={6}>
                    Geen rapportages gevonden voor deze filters.
                  </td>
                </tr>
              )}

              {reports.map((report) => {
                const student = single(report.students);
                const tutor = single(report.profiles);
                const period = single(report.report_periods);

                return (
                  <tr key={report.id}>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {student?.full_name ?? "Onbekende leerling"}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {student?.grade_level ?? "-"}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      <div>{tutor?.full_name ?? "Onbekende docent"}</div>
                      <div className="text-xs text-slate-400">
                        {tutor?.email ?? ""}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {period?.name ?? "-"}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {new Date(report.submitted_at).toLocaleDateString("nl-NL", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/reports/${report.id}`}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Bekijken
                        </Link>

                        <a
                          href={`/api/reports/${report.id}/pdf`}
                          className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
                        >
                          PDF
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
