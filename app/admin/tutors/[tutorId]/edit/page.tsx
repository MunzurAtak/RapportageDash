import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { SubmitButton } from "@/components/ui/submit-button";
import { archiveTutor, updateTutor } from "../../actions";

type EditTutorPageProps = {
  params: Promise<{
    tutorId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

type RelatedStudent = {
  id: string;
  full_name: string;
  grade_level: string | null;
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

function getErrorMessage(error?: string) {
  if (error === "missing-fields") {
    return "Vul alle verplichte velden in.";
  }

  if (error === "invalid-role") {
    return "Ongeldige rol gekozen.";
  }

  if (error === "update-failed") {
    return "Docentgegevens konden niet worden bijgewerkt.";
  }

  if (error === "archive-failed") {
    return "Bijlesdocent kon niet worden gearchiveerd.";
  }

  if (error === "cannot-archive-self") {
    return "Je kunt je eigen adminaccount niet archiveren.";
  }

  return null;
}

export default async function EditTutorPage({
  params,
  searchParams,
}: EditTutorPageProps) {
  const { tutorId } = await params;
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

  const { data: tutorData } = await supabase
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
          full_name,
          grade_level
        )
      )
    `)
    .eq("id", tutorId)
    .single();

  if (!tutorData) {
    redirect("/admin/tutors");
  }

  const tutor = tutorData as unknown as RawTutor;

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

  const errorMessage = getErrorMessage(error);

  return (
    <AdminShell
      title="Bijlesdocent bewerken"
      subtitle="Pas accountgegevens en status van de bijlesdocent aan."
      userLabel={`${profile.full_name} · ${profile.role}`}
    >
      <div className="mb-4">
        <Link
          href="/admin/tutors"
          className="text-sm font-medium text-slate-600"
        >
          ← Terug naar bijlesdocenten
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Accountgegevens
          </h2>

          {errorMessage && (
            <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <form action={updateTutor} className="mt-6 space-y-5">
            <input type="hidden" name="tutorId" value={tutor.id} />

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Voor- en achternaam *
              </label>
              <input
                name="fullName"
                required
                defaultValue={tutor.full_name}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                E-mailadres
              </label>
              <input
                value={tutor.email}
                readOnly
                className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              />
              <p className="mt-2 text-xs text-slate-500">
                E-mailadres wijzigen doen we later apart, omdat dit ook in
                Supabase Auth aangepast moet worden.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Rol *
              </label>
              <select
                name="role"
                defaultValue={tutor.role}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
              >
                <option value="tutor">Bijlesdocent</option>
                <option value="coordinator">Coördinator</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
              <input
                type="checkbox"
                name="active"
                defaultChecked={tutor.active}
                className="h-4 w-4"
              />
              <span className="text-sm text-slate-700">Account actief</span>
            </label>

            <SubmitButton
              pendingText="Opslaan..."
              className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 sm:w-auto"
            >
              Wijzigingen opslaan
            </SubmitButton>
          </form>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold text-red-700">
              Bijlesdocent archiveren
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Deze bijlesdocent wordt op inactief gezet. Het account kan daarna niet meer
              inloggen en verschijnt niet meer in actieve docent-dropdowns. Oude
              rapportages blijven bewaard.
            </p>

            <form action={archiveTutor} className="mt-4">
              <input type="hidden" name="tutorId" value={tutor.id} />
              <SubmitButton
                pendingText="Archiveren..."
                className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 sm:w-auto"
              >
                Bijlesdocent archiveren
              </SubmitButton>
            </form>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Toegewezen leerlingen
          </h2>

          <div className="mt-4 space-y-3">
            {students.length === 0 && (
              <p className="text-sm text-slate-500">
                Deze bijlesdocent heeft nog geen toegewezen leerlingen.
              </p>
            )}

            {students.map((student) => (
              <div
                key={student.id}
                className="rounded-lg border border-slate-200 p-3"
              >
                <p className="font-medium text-slate-900">
                  {student.full_name}
                </p>
                <p className="text-sm text-slate-500">
                  {student.grade_level ?? "Geen leerjaar"}
                </p>
                {student.isResponsible && (
                  <span className="mt-2 inline-flex rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                    verantwoordelijk
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
