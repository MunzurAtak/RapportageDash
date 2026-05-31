"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitReport(formData: FormData) {
  const supabase = await createClient();

  const studentId = String(formData.get("studentId") ?? "");
  const improvedSkills = String(formData.get("improvedSkills") ?? "").trim();
  const achievedGoals = String(formData.get("achievedGoals") ?? "").trim();
  const nextGoals = String(formData.get("nextGoals") ?? "").trim();
  const additionalNotes = String(formData.get("additionalNotes") ?? "").trim();

  const errorUrl = `/rapportages/nieuw?studentId=${studentId}`;

  if (
    !studentId ||
    !improvedSkills ||
    !achievedGoals ||
    !nextGoals ||
    !additionalNotes
  ) {
    redirect(`${errorUrl}&error=missing-fields`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, active, approved")
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
    .maybeSingle();

  if (!activePeriod) {
    redirect(`${errorUrl}&error=no-active-period`);
  }

  const { data: student } = await supabase
    .from("students")
    .select("id, status, reporting_required")
    .eq("id", studentId)
    .maybeSingle();

  if (
    !student ||
    student.status !== "active" ||
    student.reporting_required !== true
  ) {
    redirect("/docent");
  }

  const { data: tutorLink } = await supabase
    .from("student_tutors")
    .select("id")
    .eq("student_id", studentId)
    .eq("tutor_id", user.id)
    .eq("is_responsible", true)
    .maybeSingle();

  if (!tutorLink) {
    redirect("/docent");
  }

  const { data: existingReport } = await supabase
    .from("reports")
    .select("id")
    .eq("student_id", studentId)
    .eq("tutor_id", user.id)
    .eq("period_id", activePeriod.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingReport) {
    redirect(`${errorUrl}&error=already-submitted`);
  }

  const { error } = await supabase.from("reports").insert({
    student_id: studentId,
    tutor_id: user.id,
    period_id: activePeriod.id,
    improved_skills: improvedSkills,
    achieved_goals: achievedGoals,
    next_goals: nextGoals,
    additional_notes: additionalNotes,
  });

  if (error) {
    console.error(error);
    redirect(`${errorUrl}&error=insert-failed`);
  }

  revalidatePath("/docent");
  redirect("/docent");
}
