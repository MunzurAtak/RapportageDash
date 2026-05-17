"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  return { supabase, user };
}

export async function createTutor(formData: FormData) {
  await requireAdmin();

  const adminClient = createAdminClient();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "tutor");
  const active = formData.get("active") === "on";

  if (!fullName || !email || !password || !role) {
    redirect("/admin/tutors/new?error=missing-fields");
  }

  if (!["tutor", "coordinator", "admin"].includes(role)) {
    redirect("/admin/tutors/new?error=invalid-role");
  }

  const { data: createdUser, error: createUserError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

  if (createUserError || !createdUser.user) {
    console.error(createUserError);
    redirect("/admin/tutors/new?error=create-user-failed");
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({
      full_name: fullName,
      email,
      role,
      active,
      approved: true,
      approved_at: new Date().toISOString(),
    })
    .eq("id", createdUser.user.id);

  if (profileError) {
    console.error(profileError);
    redirect("/admin/tutors/new?error=profile-update-failed");
  }

  revalidatePath("/admin/tutors");
  redirect("/admin/tutors");
}

export async function updateTutor(formData: FormData) {
  const { supabase } = await requireAdmin();

  const tutorId = String(formData.get("tutorId") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = String(formData.get("role") ?? "tutor");
  const active = formData.get("active") === "on";

  if (!tutorId || !fullName || !role) {
    redirect(`/admin/tutors/${tutorId}/edit?error=missing-fields`);
  }

  if (!["tutor", "coordinator", "admin"].includes(role)) {
    redirect(`/admin/tutors/${tutorId}/edit?error=invalid-role`);
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      role,
      active,
    })
    .eq("id", tutorId);

  if (error) {
    console.error(error);
    redirect(`/admin/tutors/${tutorId}/edit?error=update-failed`);
  }

  revalidatePath("/admin/tutors");
  revalidatePath("/admin/students");
  revalidatePath("/docent");
  redirect("/admin/tutors");
}
