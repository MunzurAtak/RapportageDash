import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";

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

export default async function AdminReportsPage() {
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

  const { data, error } = await supabase
    .from("reports")
    .select(`
      id,
      submitted_at,
      students (
        id,
        full_name,
        grade_level
      ),
      profiles (
        id,
        full_name,
        email
      ),
      report_periods (
        id,
        name
      )
    `)
    .order("submitted_at", { ascending: false });

  const reports = (data ?? []) as unknown as RawReport[];

  return (
    <AdminShell
      title="Rapportages"
      subtitle="Bekijk alle ingediende rapportages per leerling, docent en periode."
      userLabel={`${profile.full_name} · ${profile.role}`}
    >
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Ingediende rapportages
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Hier zie je welke rapportages zijn ingevuld, door wie en voor welke
            leerling.
          </p>
        </div>

        {error && (
          <div className="m-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Rapportages konden niet worden opgehaald.
          </div>
        )}

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
                  Ingevuld door
                </th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Periode
                </th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Ingediend op
                </th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Actie
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {reports.length === 0 && (
                <tr>
                  <td className="px-6 py-5 text-slate-500" colSpan={6}>
                    Er zijn nog geen rapportages ingediend.
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
                      {new Date(report.submitted_at).toLocaleDateString(
                        "nl-NL",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/reports/${report.id}`}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Bekijken
                      </Link>
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
