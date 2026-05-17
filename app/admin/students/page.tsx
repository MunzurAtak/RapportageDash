import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";

type RelatedTutor = {
  id: string;
  full_name: string;
  email: string;
};

type StudentTutorLink = {
  is_responsible: boolean;
  profiles: RelatedTutor | RelatedTutor[] | null;
};

type RawStudent = {
  id: string;
  full_name: string;
  grade_level: string | null;
  status: string;
  reporting_required: boolean;
  student_tutors: StudentTutorLink[];
};

function single<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export default async function AdminStudentsPage() {
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

  const { data, error } = await supabase
    .from("students")
    .select(`
      id,
      full_name,
      grade_level,
      status,
      reporting_required,
      student_tutors (
        is_responsible,
        profiles (
          id,
          full_name,
          email
        )
      )
    `)
    .order("full_name", { ascending: true });

  const students = (data ?? []) as unknown as RawStudent[];

  return (
    <AdminShell
      title="Leerlingen"
      subtitle="Bekijk, voeg toe en beheer leerlingen en hun toegewezen bijlesdocenten."
      userLabel={`${profile.full_name} · ${profile.role}`}
    >
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Alle leerlingen
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Overzicht van actieve en inactieve leerlingen.
            </p>
          </div>

          <Link
            href="/admin/students/new"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            + Nieuw toevoegen
          </Link>
        </div>

        {error && (
          <div className="m-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Leerlingen konden niet worden opgehaald.
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
                  Status
                </th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Rapportageplicht
                </th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Toegewezen bijlesdocenten
                </th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Actie
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {students.length === 0 && (
                <tr>
                  <td className="px-6 py-5 text-slate-500" colSpan={6}>
                    Er zijn nog geen leerlingen toegevoegd.
                  </td>
                </tr>
              )}

              {students.map((student) => {
                const tutors = student.student_tutors
                  .map((link) => {
                    const tutor = single(link.profiles);
                    if (!tutor) return null;

                    return {
                      ...tutor,
                      isResponsible: link.is_responsible,
                    };
                  })
                  .filter((tutor) => tutor !== null);

                return (
                  <tr key={student.id}>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {student.full_name}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {student.grade_level ?? "-"}
                    </td>

                    <td className="px-6 py-4">
                      {student.status === "active" ? (
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                          Actief
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          Inactief
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {student.reporting_required ? "Ja" : "Nee"}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {tutors.length === 0 ? (
                        <span className="text-slate-400">Geen docent</span>
                      ) : (
                        <div className="space-y-1">
                          {tutors.map((tutor) => (
                            <div key={tutor.id}>
                              {tutor.full_name}
                              {tutor.isResponsible && (
                                <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                                  verantwoordelijk
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/students/${student.id}/edit`}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Bewerken
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