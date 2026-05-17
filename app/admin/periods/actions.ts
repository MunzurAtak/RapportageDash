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

export async function createPeriod(formData: FormData) {
  const supabase = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const deadline = String(formData.get("deadline") ?? "");
  const active = formData.get("active") === "on";

  if (!name || !startDate || !endDate || !deadline) {
    redirect("/admin/periods/new?error=missing-fields");
  }

  if (active) {
    const { error: deactivateError } = await supabase
      .from("report_periods")
      .update({ active: false })
      .eq("active", true);

    if (deactivateError) {
      console.error(deactivateError);
      redirect("/admin/periods/new?error=deactivate-failed");
    }
  }

  const { error } = await supabase.from("report_periods").insert({
    name,
    start_date: startDate,
    end_date: endDate,
    deadline,
    active,
  });

  if (error) {
    console.error(error);
    redirect("/admin/periods/new?error=insert-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/periods");
  revalidatePath("/docent");
  redirect("/admin/periods");
}

export async function activatePeriod(formData: FormData) {
  const supabase = await requireAdmin();

  const periodId = String(formData.get("periodId") ?? "");

  if (!periodId) {
    redirect("/admin/periods?error=missing-period");
  }

  const { error: deactivateError } = await supabase
    .from("report_periods")
    .update({ active: false })
    .eq("active", true);

  if (deactivateError) {
    console.error(deactivateError);
    redirect("/admin/periods?error=deactivate-failed");
  }

  const { error: activateError } = await supabase
    .from("report_periods")
    .update({ active: true })
    .eq("id", periodId);

  if (activateError) {
    console.error(activateError);
    redirect("/admin/periods?error=activate-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/periods");
  revalidatePath("/docent");
  redirect("/admin/periods");
}
