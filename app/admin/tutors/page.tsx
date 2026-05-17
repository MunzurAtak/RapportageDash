import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";

type RelatedStudent = {
  id: string;
  full_name: string;
};

type StudentTutorLink = {
  is_responsible: boolean;
  students: RelatedStudent | RelatedStudent[] | null;
};

type RawTutor = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  active: boolean;
  student_tutors: StudentTutorLink[];
};

function single<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
      Actief
    </span>
  ) : (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
      Inactief
    </span>
  );
}

export default async function AdminTutorsPage() {
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
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      role,
      active,
      student_tutors (
        is_responsible,
        students (
          id,
          full_name
        )
      )
    `)
    .in("role", ["tutor", "coordinator", "admin"])
    .order("full_name", { ascending: true });

  const tutors = (data ?? []) as unknown as RawTutor[];

  return (
    <AdminShell
      title="Bijlesdocenten & Personeel"
      subtitle="Bekijk, voeg toe en beheer bijlesdocenten en personeelsleden."
      userLabel={`${profile.full_name} · ${profile.role}`}
    >
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Alle bijlesdocenten & personeel
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Overzicht van gebruikers, rollen en toegewezen leerlingen.
            </p>
          </div>

          <Link
            href="/admin/tutors/new"
            className="inline-flex w-full justify-center rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 sm:w-auto"
          >
            + Nieuw toevoegen
          </Link>
        </div>

        {error && (
          <div className="m-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:m-6">
            Bijlesdocenten konden niet worden opgehaald.
          </div>
        )}

        {/* Mobile cards */}
        <div className="divide-y divide-slate-200 bg-white md:hidden">
          {tutors.length === 0 && (
            <div className="px-4 py-5 text-sm text-slate-500">
              Er zijn nog geen bijlesdocenten of personeelsleden.
            </div>
          )}

          {tutors.map((tutor) => {
            const students = tutor.student_tutors
              .map((link) => {
                const student = single(link.students);
                if (!student) return null;

                return {
                  ...student,
                  isResponsible: link.is_responsible,
                };
              })
              .filter((student) => student !== null);

            return (
              <div key={tutor.id} className="px-4 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {tutor.full_name}
                    </p>
                    <p className="break-all text-sm text-slate-500">
                      {tutor.email}
                    </p>
                  </div>

                  <StatusBadge active={tutor.active} />
                </div>

                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Rol</dt>
                    <dd className="text-slate-900">{tutor.role}</dd>
                  </div>

                  <div>
                    <dt className="text-slate-500">Toegewezen leerlingen</dt>
                    <dd className="mt-1 text-slate-900">
                      {students.length === 0 ? (
                        <span className="text-slate-400">
                          Geen leerlingen
                        </span>
                      ) : (
                        <div className="space-y-2">
                          {students.map((student) => (
                            <div key={student.id}>
                              <span>{student.full_name}</span>
                              {student.isResponsible && (
                                <span className="ml-2 inline-flex rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                                  verantwoordelijk
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4">
                  <Link
                    href={`/admin/tutors/${tutor.id}/edit`}
                    className="inline-flex w-full justify-center rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Bewerken
                  </Link>
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
                <th className="px-6 py-3 font-medium text-slate-600">Naam</th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  E-mailadres
                </th>
                <th className="px-6 py-3 font-medium text-slate-600">Rol</th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Status
                </th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Toegewezen leerlingen
                </th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Actie
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {tutors.length === 0 && (
                <tr>
                  <td className="px-6 py-5 text-slate-500" colSpan={6}>
                    Er zijn nog geen bijlesdocenten of personeelsleden.
                  </td>
                </tr>
              )}

              {tutors.map((tutor) => {
                const students = tutor.student_tutors
                  .map((link) => {
                    const student = single(link.students);
                    if (!student) return null;

                    return {
                      ...student,
                      isResponsible: link.is_responsible,
                    };
                  })
                  .filter((student) => student !== null);

                return (
                  <tr key={tutor.id}>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {tutor.full_name}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {tutor.email}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {tutor.role}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge active={tutor.active} />
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {students.length === 0 ? (
                        <span className="text-slate-400">
                          Geen leerlingen
                        </span>
                      ) : (
                        <div className="space-y-1">
                          {students.map((student) => (
                            <div key={student.id}>
                              {student.full_name}
                              {student.isResponsible && (
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
                        href={`/admin/tutors/${tutor.id}/edit`}
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
