"use server";

import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type TutorBirdRow = {
  Voornaam?: string;
  Achternaam?: string;
  Bijlesdocent?: string;
};

type ParsedRow = {
  fullName: string;
  tutorNames: string[];
};

type Tutor = {
  id: string;
  full_name: string;
};

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeKey(value: string) {
  return normalize(value).toLowerCase();
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

function parseTutorBirdCsv(csvText: string): ParsedRow[] {
  const result = Papa.parse<TutorBirdRow>(csvText, {
    header: true,
    delimiter: ";",
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
  });

  const fatalErrors = result.errors.filter(
    (error) => error.type !== "FieldMismatch"
  );

  if (fatalErrors.length > 0) {
    console.error(fatalErrors);
    throw new Error("CSV kon niet goed worden gelezen.");
  }

  const rows = result.data
    .map((row) => {
      const firstName = normalize(row.Voornaam ?? "");
      const lastName = normalize(row.Achternaam ?? "");
      const fullName = normalize(`${firstName} ${lastName}`);

      const tutorNames = String(row.Bijlesdocent ?? "")
        .split(";")
        .map((name) => normalize(name))
        .filter(Boolean);

      return {
        fullName,
        tutorNames,
      };
    })
    .filter((row) => row.fullName.length > 0);

  const uniqueRows = new Map<string, ParsedRow>();

  for (const row of rows) {
    const key = normalizeKey(row.fullName);

    if (!uniqueRows.has(key)) {
      uniqueRows.set(key, row);
    }
  }

  return Array.from(uniqueRows.values());
}

export async function importStudentsFromCsv(formData: FormData) {
  const supabase = await requireAdmin();

  const file = formData.get("csvFile");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/import/students?error=missing-file");
  }

  let parsedRows: ParsedRow[];

  try {
    const csvText = await file.text();
    parsedRows = parseTutorBirdCsv(csvText);
  } catch (error) {
    console.error(error);
    redirect("/admin/import/students?error=parse-failed");
  }

  if (parsedRows.length === 0) {
    redirect("/admin/import/students?error=no-valid-rows");
  }

  const { data: existingStudentsData } = await supabase
    .from("students")
    .select("id, full_name");

  const { data: tutorsData } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("role", ["tutor", "coordinator", "admin"]);

  const existingStudentsByName = new Map(
    (existingStudentsData ?? []).map((student) => [
      normalizeKey(student.full_name),
      student,
    ])
  );

  const tutorsByName = new Map(
    (tutorsData ?? []).map((tutor) => [normalizeKey(tutor.full_name), tutor])
  );

  let createdCount = 0;
  let updatedCount = 0;
  let linkedCount = 0;
  let skippedCount = 0;

  const missingTutors = new Set<string>();

  for (const row of parsedRows) {
    let student = existingStudentsByName.get(normalizeKey(row.fullName));

    if (!student) {
      const { data: createdStudent, error: createError } = await supabase
        .from("students")
        .insert({
          full_name: row.fullName,
          grade_level: "Onbekend",
          status: "active",
          reporting_required: true,
        })
        .select("id, full_name")
        .single();

      if (createError || !createdStudent) {
        console.error(createError);
        skippedCount += 1;
        continue;
      }

      student = createdStudent;
      existingStudentsByName.set(normalizeKey(row.fullName), createdStudent);
      createdCount += 1;
    } else {
      const { error: updateError } = await supabase
        .from("students")
        .update({
          status: "active",
          reporting_required: true,
        })
        .eq("id", student.id);

      if (updateError) {
        console.error(updateError);
        skippedCount += 1;
        continue;
      }

      updatedCount += 1;
    }

    const matchedTutors = row.tutorNames
      .map((name) => {
        const tutor = tutorsByName.get(normalizeKey(name));

        if (!tutor) {
          missingTutors.add(name);
          return null;
        }

        return tutor;
      })
      .filter((tutor): tutor is Tutor => tutor !== null);

    if (matchedTutors.length === 0) {
      continue;
    }

    const { error: deleteLinksError } = await supabase
      .from("student_tutors")
      .delete()
      .eq("student_id", student.id);

    if (deleteLinksError) {
      console.error(deleteLinksError);
      skippedCount += 1;
      continue;
    }

    const links = matchedTutors.map((tutor, index) => ({
      student_id: student.id,
      tutor_id: tutor.id,
      is_responsible: index === 0,
    }));

    const { error: insertLinksError } = await supabase
      .from("student_tutors")
      .insert(links);

    if (insertLinksError) {
      console.error(insertLinksError);
      skippedCount += 1;
      continue;
    }

    linkedCount += links.length;
  }

  const missingTutorList = Array.from(missingTutors).slice(0, 20).join(",");

  revalidatePath("/admin");
  revalidatePath("/admin/students");
  revalidatePath("/admin/tutors");
  revalidatePath("/docent");

  const params = new URLSearchParams({
    imported: String(parsedRows.length),
    created: String(createdCount),
    updated: String(updatedCount),
    linked: String(linkedCount),
    skipped: String(skippedCount),
    missingTutors: missingTutorList,
  });

  redirect(`/admin/import/students?${params.toString()}`);
}
