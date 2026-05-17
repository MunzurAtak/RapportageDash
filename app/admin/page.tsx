import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";

type RelatedStudent = {
  id: string;
  full_name: string;
  grade_level: string | null;
  status: string;
  reporting_required: boolean;
};

type RelatedTutor = {
  id: string;
  full_name: string;
  email: string;
};

type ExpectedReportLink = {
  student_id: string;
  tutor_id: string;
  is_responsible: boolean;
  students: RelatedStudent | RelatedStudent[] | null;
  profiles: RelatedTutor | RelatedTutor[] | null;
};

type SubmittedReport = {
  student_id: string;
  tutor_id: string;
};

function single<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

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

  const { data: activePeriod } = await supabase
    .from("report_periods")
    .select("id, name, deadline")
    .eq("active", true)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: expectedLinksData } = await supabase
    .from("student_tutors")
    .select(`
      student_id,
      tutor_id,
      is_responsible,
      students (
        id,
        full_name,
        grade_level,
        status,
        reporting_required
      ),
      profiles (
        id,
        full_name,
        email
      )
    `)
    .eq("is_responsible", true);

  const expectedLinks = ((expectedLinksData ?? []) as unknown as ExpectedReportLink[])
    .map((link) => {
      const student = single(link.students);
      const tutor = single(link.profiles);

      return {
        student,
        tutor,
        studentId: link.student_id,
        tutorId: link.tutor_id,
      };
    })
    .filter(
      (item) =>
        item.student &&
        item.tutor &&
        item.student.status === "active" &&
        item.student.reporting_required === true
    );

  const { data: submittedReportsData } = activePeriod
    ? await supabase
        .from("reports")
        .select("student_id, tutor_id")
        .eq("period_id", activePeriod.id)
        .is("deleted_at", null)
    : { data: [] };

  const submittedReports = (submittedReportsData ?? []) as SubmittedReport[];

  const submittedKeys = new Set(
    submittedReports.map((report) => `${report.student_id}:${report.tutor_id}`)
  );

  const expectedCount = expectedLinks.length;
  const submittedCount = expectedLinks.filter((item) =>
    submittedKeys.has(`${item.studentId}:${item.tutorId}`)
  ).length;
  const missingCount = expectedCount - submittedCount;
  const completionPercentage =
    expectedCount === 0 ? 0 : Math.round((submittedCount / expectedCount) * 100);

  const missingReports = expectedLinks.filter(
    (item) => !submittedKeys.has(`${item.studentId}:${item.tutorId}`)
  );

  return (
    <AdminShell
      title="Home"
      subtitle="Overzicht van rapportages en openstaande acties."
      userLabel={`${profile.full_name} · ${profile.role}`}
    >
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">Actieve rapportageperiode</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">
          {activePeriod?.name ?? "Geen actieve periode"}
        </p>
        {activePeriod?.deadline && (
          <p className="mt-1 text-sm text-slate-600">
            Deadline: {activePeriod.deadline}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Verwachte rapportages</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {expectedCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Ingeleverd</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {submittedCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Ontbreekt</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {missingCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Compleet</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {completionPercentage}%
          </p>
        </div>
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Actielijst ontbrekende rapportages
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Leerlingen waarvoor de verantwoordelijke bijlesdocent nog geen
            rapportage heeft ingediend.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Leerling
                </th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Leerjaar
                </th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Verantwoordelijke docent
                </th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  E-mailadres docent
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {!activePeriod && (
                <tr>
                  <td className="px-6 py-5 text-slate-500" colSpan={4}>
                    Er is geen actieve periode ingesteld.
                  </td>
                </tr>
              )}

              {activePeriod && missingReports.length === 0 && (
                <tr>
                  <td className="px-6 py-5 text-slate-500" colSpan={4}>
                    Er ontbreken geen rapportages.
                  </td>
                </tr>
              )}

              {activePeriod &&
                missingReports.map((item) => (
                  <tr key={`${item.studentId}:${item.tutorId}`}>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {item.student?.full_name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.student?.grade_level ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.tutor?.full_name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.tutor?.email}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
