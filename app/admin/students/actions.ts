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

  if (profile.role !== "admin" && profile.role !== "coordinator") {
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

export async function updateStudent(formData: FormData) {
  const supabase = await requireAdmin();

  const studentId = String(formData.get("studentId") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const gradeLevel = String(formData.get("gradeLevel") ?? "").trim();
  const status = String(formData.get("status") ?? "active");
  const reportingRequired = formData.get("reportingRequired") === "on";
  const responsibleTutorId = String(formData.get("responsibleTutorId") ?? "");

  if (!studentId || !fullName || !gradeLevel || !responsibleTutorId) {
    redirect(`/admin/students/${studentId}/edit?error=missing-fields`);
  }

  const { error: studentError } = await supabase
    .from("students")
    .update({
      full_name: fullName,
      grade_level: gradeLevel,
      status,
      reporting_required: reportingRequired,
    })
    .eq("id", studentId);

  if (studentError) {
    console.error(studentError);
    redirect(`/admin/students/${studentId}/edit?error=update-failed`);
  }

  const { error: deleteLinksError } = await supabase
    .from("student_tutors")
    .delete()
    .eq("student_id", studentId);

  if (deleteLinksError) {
    console.error(deleteLinksError);
    redirect(`/admin/students/${studentId}/edit?error=link-update-failed`);
  }

  const { error: insertLinkError } = await supabase
    .from("student_tutors")
    .insert({
      student_id: studentId,
      tutor_id: responsibleTutorId,
      is_responsible: true,
    });

  if (insertLinkError) {
    console.error(insertLinkError);
    redirect(`/admin/students/${studentId}/edit?error=link-update-failed`);
  }

  revalidatePath("/admin/students");
  revalidatePath("/docent");
  redirect("/admin/students");
}
