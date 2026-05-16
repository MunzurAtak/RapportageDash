import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/logout-button";

type ReportPageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

export default async function ReportPage({ params }: ReportPageProps) {
  const { studentId } = await params;
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

  const { data: student } = await supabase
    .from("students")
    .select("id, full_name")
    .eq("id", studentId)
    .single();

  if (!student) {
    redirect("/docent");
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
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {student.full_name}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Het echte formulier bouwen we in de volgende stap.
          </p>
        </div>
      </div>
    </main>
  );
}
