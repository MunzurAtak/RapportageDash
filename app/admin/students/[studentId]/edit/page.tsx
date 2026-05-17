import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { updateStudent } from "../../actions";

type EditStudentPageProps = {
  params: Promise<{
    studentId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

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

function getErrorMessage(error?: string) {
  if (error === "missing-fields") {
    return "Vul alle verplichte velden in.";
  }

  if (error === "update-failed") {
    return "Leerlinggegevens konden niet worden bijgewerkt.";
  }

  if (error === "link-update-failed") {
    return "Docentkoppeling kon niet worden bijgewerkt.";
  }

  return null;
}

export default async function EditStudentPage({
  params,
  searchParams,
}: EditStudentPageProps) {
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

  if (profile.role !== "admin" && profile.role !== "coordinator") {
    redirect("/docent");
  }

  const { data: studentData } = await supabase
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
    .eq("id", studentId)
    .single();

  if (!studentData) {
    redirect("/admin/students");
  }

  const student = studentData as unknown as RawStudent;

  const responsibleLink =
    student.student_tutors.find((link) => link.is_responsible) ?? null;

  const responsibleTutor = responsibleLink
    ? single(responsibleLink.profiles)
    : null;

  const { data: tutors } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "tutor")
    .eq("active", true)
    .order("full_name", { ascending: true });

  const errorMessage = getErrorMessage(error);

  return (
    <AdminShell
      title="Leerling bewerken"
      subtitle="Pas leerlinggegevens en verantwoordelijke bijlesdocent aan."
      userLabel={`${profile.full_name} · ${profile.role}`}
    >
      <div className="mb-4">
        <Link
          href="/admin/students"
          className="text-sm font-medium text-slate-600"
        >
          ← Terug naar leerlingen
        </Link>
      </div>

      <section className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Leerlinggegevens
        </h2>

        {errorMessage && (
          <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <form action={updateStudent} className="mt-6 space-y-5">
          <input type="hidden" name="studentId" value={student.id} />

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Voor- en achternaam leerling *
            </label>
            <input
              name="fullName"
              required
              defaultValue={student.full_name}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Leerjaar leerling *
            </label>
            <input
              name="gradeLevel"
              required
              defaultValue={student.grade_level ?? ""}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
              placeholder="Bijvoorbeeld: Groep 8, 2 havo, 4 vwo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Status *
            </label>
            <select
              name="status"
              defaultValue={student.status}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="active">Actief</option>
              <option value="inactive">Inactief</option>
            </select>
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
            <input
              type="checkbox"
              name="reportingRequired"
              defaultChecked={student.reporting_required}
              className="h-4 w-4"
            />
            <span className="text-sm text-slate-700">
              Rapportageplicht actief
            </span>
          </label>

          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-medium text-slate-900">
              Verantwoordelijke bijlesdocent
            </h3>

            <select
              name="responsibleTutorId"
              required
              defaultValue={responsibleTutor?.id ?? ""}
              className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="">Selecteer bijlesdocent</option>
              {(tutors ?? []).map((tutor) => (
                <option key={tutor.id} value={tutor.id}>
                  {tutor.full_name} — {tutor.email}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Wijzigingen opslaan
          </button>
        </form>
      </section>
    </AdminShell>
  );
}
