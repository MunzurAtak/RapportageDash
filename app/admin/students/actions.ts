"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "coordinator")) {
    redirect("/docent");
  }

  return supabase;
}

export async function createStudent(formData: FormData) {
  const supabase = await requireAdmin();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const gradeLevel = String(formData.get("gradeLevel") ?? "").trim();
  const status = String(formData.get("status") ?? "active");
  const reportingRequired = formData.get("reportingRequired") === "on";
  const responsibleTutorId = String(formData.get("responsibleTutorId") ?? "");

  if (!fullName || !gradeLevel || !responsibleTutorId) {
    redirect("/admin/students/new?error=missing-fields");
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .insert({
      full_name: fullName,
      grade_level: gradeLevel,
      status,
      reporting_required: reportingRequired,
    })
    .select("id")
    .single();

  if (studentError || !student) {
    console.error(studentError);
    redirect("/admin/students/new?error=insert-failed");
  }

  const { error: linkError } = await supabase.from("student_tutors").insert({
    student_id: student.id,
    tutor_id: responsibleTutorId,
    is_responsible: true,
  });

  if (linkError) {
    console.error(linkError);
    redirect("/admin/students/new?error=link-failed");
  }

  revalidatePath("/admin/students");
  revalidatePath("/docent");
  redirect("/admin/students");
}