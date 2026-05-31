"use server";

import { Resend } from "resend";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type RelatedStudent = {
  id: string;
  full_name: string;
  grade_level: string | null;
  status: string;
  reporting_required: boolean;
};

type RelatedTutor = {
  id: string;
  full_name: string;
  email: string;
  active: boolean;
};

type ExpectedReportLink = {
  student_id: string;
  tutor_id: string;
  is_responsible: boolean;
  students: RelatedStudent | RelatedStudent[] | null;
  profiles: RelatedTutor | RelatedTutor[] | null;
};

type SubmittedReport = {
  student_id: string;
  tutor_id: string;
};

function single<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

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

export async function sendReportReminders() {
  const supabase = await requireAdmin();

  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    redirect("/admin?error=missing-resend-key");
  }

  const resend = new Resend(resendApiKey);

  const { data: activePeriod } = await supabase
    .from("report_periods")
    .select("id, name, deadline")
    .eq("active", true)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!activePeriod) {
    redirect("/admin?error=no-active-period");
  }

  const { data: expectedLinksData } = await supabase
    .from("student_tutors")
    .select(`
      student_id,
      tutor_id,
      is_responsible,
      students (
        id,
        full_name,
        grade_level,
        status,
        reporting_required
      ),
      profiles (
        id,
        full_name,
        email,
        active
      )
    `)
    .eq("is_responsible", true);

  const expectedLinks = ((expectedLinksData ?? []) as unknown as ExpectedReportLink[])
    .map((link) => {
      const student = single(link.students);
      const tutor = single(link.profiles);

      return {
        student,
        tutor,
        studentId: link.student_id,
        tutorId: link.tutor_id,
      };
    })
    .filter(
      (item) =>
        item.student &&
        item.tutor &&
        item.tutor.active === true &&
        item.student.status === "active" &&
        item.student.reporting_required === true
    );

  const { data: submittedReportsData } = await supabase
    .from("reports")
    .select("student_id, tutor_id")
    .eq("period_id", activePeriod.id)
    .is("deleted_at", null);

  const submittedReports = (submittedReportsData ?? []) as SubmittedReport[];

  const submittedKeys = new Set(
    submittedReports.map((report) => `${report.student_id}:${report.tutor_id}`)
  );

  const missingReports = expectedLinks.filter(
    (item) => !submittedKeys.has(`${item.studentId}:${item.tutorId}`)
  );

  if (missingReports.length === 0) {
    redirect("/admin?reminders=none");
  }

  const groupedByTutor = new Map<
    string,
    {
      tutor: RelatedTutor;
      students: RelatedStudent[];
    }
  >();

  for (const item of missingReports) {
    if (!item.tutor || !item.student) continue;

    const existing = groupedByTutor.get(item.tutor.id);

    if (existing) {
      existing.students.push(item.student);
    } else {
      groupedByTutor.set(item.tutor.id, {
        tutor: item.tutor,
        students: [item.student],
      });
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://010opniveau.netlify.app";
  const fromEmail =
    process.env.REMINDER_FROM_EMAIL ?? "RapportageDash <onboarding@resend.dev>";

  let sentCount = 0;

  for (const group of groupedByTutor.values()) {
    const studentListHtml = group.students
      .map(
        (student) =>
          `<li>${escapeHtml(student.full_name)}${
            student.grade_level ? ` - ${escapeHtml(student.grade_level)}` : ""
          }</li>`
      )
      .join("");

    const studentListText = group.students
      .map(
        (student) =>
          `- ${student.full_name}${student.grade_level ? ` - ${student.grade_level}` : ""}`
      )
      .join("\n");

    const subject = `Herinnering rapportages ${activePeriod.name}`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2>Herinnering rapportages</h2>
        <p>Beste ${escapeHtml(group.tutor.full_name)},</p>

        <p>
          Voor de periode <strong>${escapeHtml(activePeriod.name)}</strong>
          ontbreken nog rapportages voor de volgende leerling(en):
        </p>

        <ul>
          ${studentListHtml}
        </ul>

        ${
          activePeriod.deadline
            ? `<p>Deadline: <strong>${escapeHtml(activePeriod.deadline)}</strong></p>`
            : ""
        }

        <p>
          Je kunt de rapportages invullen via:
          <br />
          <a href="${appUrl}/docent">${appUrl}/docent</a>
        </p>

        <p>Met vriendelijke groet,<br />010 op niveau</p>
      </div>
    `;

    const text = `
Beste ${group.tutor.full_name},

Voor de periode ${activePeriod.name} ontbreken nog rapportages voor:

${studentListText}

${activePeriod.deadline ? `Deadline: ${activePeriod.deadline}` : ""}

Rapportages invullen:
${appUrl}/docent

Met vriendelijke groet,
010 op niveau
    `.trim();

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: group.tutor.email,
      subject,
      html,
      text,
    });

    if (error) {
      console.error(error);
      redirect("/admin?error=reminder-send-failed");
    }

    sentCount += 1;
  }

  redirect(`/admin?reminders=sent&count=${sentCount}`);
}
