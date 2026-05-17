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

export async function archiveReport(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const reportId = String(formData.get("reportId") ?? "");

  if (!reportId) {
    redirect("/admin/reports?error=missing-report");
  }

  const { error } = await supabase
    .from("reports")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
    })
    .eq("id", reportId);

  if (error) {
    console.error(error);
    redirect(`/admin/reports/${reportId}?error=archive-failed`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  redirect("/admin/reports");
}
