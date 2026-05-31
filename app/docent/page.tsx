import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function DocentPage() {
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

  const { data: activePeriod } = await supabase
    .from("report_periods")
    .select("id, name, deadline")
    .eq("active", true)
    .order("start_date", { ascending: false })
    .limit(1)
    .single();

  const { data: studentLinks, error: studentsError } = await supabase
    .from("student_tutors")
    .select(`
      is_responsible,
      students (
        id,
        full_name,
        status,
        reporting_required
      )
    `)
    .eq("tutor_id", user.id)
    .eq("is_responsible", true);

  if (studentsError) {
    console.error(studentsError);
  }

  const students =
    studentLinks
      ?.flatMap((link) => link.students ?? [])
      .filter(
        (student) =>
          student.status === "active" && student.reporting_required === true
      ) ?? [];

  const { data: submittedReports } = activePeriod
    ? await supabase
        .from("reports")
        .select("student_id")
        .eq("tutor_id", user.id)
        .eq("period_id", activePeriod.id)
        .is("deleted_at", null)
    : { data: [] };

  const submittedStudentIds = new Set(
    submittedReports?.map((report) => report.student_id) ?? []
  );

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-sm font-medium text-slate-500">010 op niveau</p>
            <h1 className="text-xl font-semibold text-slate-900">
              Docent dashboard
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-600">
              {profile.full_name} · {profile.role}
            </p>
            {(profile.role === "admin" || profile.role === "coordinator") && (
              <Link
                href="/admin"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Naar admin
              </Link>
            )}

            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Mijn rapportages
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Actieve periode:{" "}
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

            <div className="rounded-lg bg-slate-100 px-4 py-3 text-right">
              <p className="text-sm text-slate-500">Openstaand</p>
              <p className="text-2xl font-semibold text-slate-900">
                {
                  students.filter(
                    (student) => !submittedStudentIds.has(student.id)
                  ).length
                }
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            {/* Mobile cards */}
            <div className="divide-y divide-slate-200 bg-white md:hidden">
              {students.length === 0 && (
                <div className="px-4 py-4 text-sm text-slate-500">
                  Geen actieve leerlingen gevonden waarvoor jij verantwoordelijk bent.
                </div>
              )}

              {students.map((student) => {
                const submitted = submittedStudentIds.has(student.id);

                return (
                  <div key={student.id} className="px-4 py-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {student.full_name}
                        </p>

                        <div className="mt-2">
                          {submitted ? (
                            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                              Ingeleverd
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                              Ontbreekt
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      {submitted ? (
                        <span className="text-sm text-slate-400">
                          Geen actie nodig
                        </span>
                      ) : (
                        <Link
                          href={`/rapportages/nieuw?studentId=${student.id}`}
                          className="inline-flex w-full justify-center rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
                        >
                          Invullen
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-600">Leerling</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Actie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {students.length === 0 && (
                    <tr>
                      <td className="px-4 py-4 text-slate-500" colSpan={3}>
                        Geen actieve leerlingen gevonden waarvoor jij verantwoordelijk bent.
                      </td>
                    </tr>
                  )}

                  {students.map((student) => {
                    const submitted = submittedStudentIds.has(student.id);

                    return (
                      <tr key={student.id}>
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {student.full_name}
                        </td>
                        <td className="px-4 py-4">
                          {submitted ? (
                            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                              Ingeleverd
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                              Ontbreekt
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {submitted ? (
                            <span className="text-sm text-slate-400">
                              Geen actie nodig
                            </span>
                          ) : (
                            <Link
                              href={`/rapportages/nieuw?studentId=${student.id}`}
                              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
                            >
                              Invullen
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
