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

  return { supabase, user };
}

export async function approveRegistration(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const profileId = String(formData.get("profileId") ?? "");
  const role = String(formData.get("role") ?? "tutor");

  if (!profileId) {
    redirect("/admin/registrations?error=missing-profile");
  }

  if (!["tutor", "coordinator", "admin"].includes(role)) {
    redirect("/admin/registrations?error=invalid-role");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      approved: true,
      active: true,
      role,
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq("id", profileId);

  if (error) {
    console.error(error);
    redirect("/admin/registrations?error=approve-failed");
  }

  revalidatePath("/admin/registrations");
  revalidatePath("/admin/tutors");
  redirect("/admin/registrations");
}

export async function rejectRegistration(formData: FormData) {
  const { supabase } = await requireAdmin();

  const profileId = String(formData.get("profileId") ?? "");

  if (!profileId) {
    redirect("/admin/registrations?error=missing-profile");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      active: false,
      approved: false,
    })
    .eq("id", profileId);

  if (error) {
    console.error(error);
    redirect("/admin/registrations?error=reject-failed");
  }

  revalidatePath("/admin/registrations");
  redirect("/admin/registrations");
}
