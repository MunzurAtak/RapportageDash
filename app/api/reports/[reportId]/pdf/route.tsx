import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToStream,
} from "@react-pdf/renderer";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type PdfRouteProps = {
  params: Promise<{
    reportId: string;
  }>;
};

type RelatedStudent = {
  full_name: string;
  grade_level: string | null;
};

type RelatedTutor = {
  full_name: string;
  email: string;
};

type RelatedPeriod = {
  name: string;
};

type RawReport = {
  id: string;
  submitted_at: string;
  improved_skills: string;
  achieved_goals: string;
  next_goals: string;
  additional_notes: string | null;
  students: RelatedStudent | RelatedStudent[] | null;
  profiles: RelatedTutor | RelatedTutor[] | null;
  report_periods: RelatedPeriod | RelatedPeriod[] | null;
};

function single<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    color: "#475569",
    marginBottom: 24,
  },
  section: {
    marginBottom: 14,
  },
  label: {
    fontSize: 10,
    color: "#475569",
    marginBottom: 4,
    fontWeight: 700,
  },
  value: {
    fontSize: 11,
    lineHeight: 1.5,
  },
  box: {
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  footer: {
    marginTop: 24,
    paddingTop: 12,
    borderTop: "1px solid #e2e8f0",
    fontSize: 9,
    color: "#64748b",
  },
});

function ReportPdfDocument({ report }: { report: RawReport }) {
  const student = single(report.students);
  const tutor = single(report.profiles);
  const period = single(report.report_periods);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Maandelijkse Progressie Formulier</Text>

        <Text style={styles.subtitle}>
          010 op niveau - gegenereerd vanuit RapportageDash
        </Text>

        <View style={styles.box}>
          <View style={styles.section}>
            <Text style={styles.label}>1. E-mailadres</Text>
            <Text style={styles.value}>{tutor?.email ?? "-"}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>2. Voor- en achternaam begeleider</Text>
            <Text style={styles.value}>{tutor?.full_name ?? "-"}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>3. Voor- en achternaam leerling</Text>
            <Text style={styles.value}>{student?.full_name ?? "-"}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>4. Leerjaar leerling</Text>
            <Text style={styles.value}>{student?.grade_level ?? "-"}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>5. Maand</Text>
            <Text style={styles.value}>{period?.name ?? "-"}</Text>
          </View>
        </View>

        <View style={styles.box}>
          <View style={styles.section}>
            <Text style={styles.label}>
              6. Beschrijf gedetailleerd welke specifieke vaardigheden de
              leerling de afgelopen maand heeft verbeterd.
            </Text>
            <Text style={styles.value}>{report.improved_skills}</Text>
          </View>
        </View>

        <View style={styles.box}>
          <View style={styles.section}>
            <Text style={styles.label}>
              7. Welke doelen van vorige maand zijn behaald?
            </Text>
            <Text style={styles.value}>{report.achieved_goals}</Text>
          </View>
        </View>

        <View style={styles.box}>
          <View style={styles.section}>
            <Text style={styles.label}>
              8. Wat zijn de doelstellingen voor de volgende maand?
            </Text>
            <Text style={styles.value}>{report.next_goals}</Text>
          </View>
        </View>

        <View style={styles.box}>
          <View style={styles.section}>
            <Text style={styles.label}>
              9. Overige opmerkingen: gedrag, lesvoorbereiding, aanwezigheid
            </Text>
            <Text style={styles.value}>{report.additional_notes ?? "-"}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Ingediend op:{" "}
          {new Date(report.submitted_at).toLocaleDateString("nl-NL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </Page>
    </Document>
  );
}

export async function GET(_request: Request, { params }: PdfRouteProps) {
  const { reportId } = await params;
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
    return new Response("Geen toegang", { status: 403 });
  }

  const { data } = await supabase
    .from("reports")
    .select(`
      id,
      submitted_at,
      improved_skills,
      achieved_goals,
      next_goals,
      additional_notes,
      students (
        full_name,
        grade_level
      ),
      profiles!reports_tutor_id_fkey (
        full_name,
        email
      ),
      report_periods (
        name
      )
    `)
    .eq("id", reportId)
    .is("deleted_at", null)
    .single();

  if (!data) {
    return new Response("Rapportage niet gevonden", { status: 404 });
  }

  const report = data as unknown as RawReport;
  const student = single(report.students);
  const period = single(report.report_periods);

  const filename = `${slugify(
    student?.full_name ?? "leerling"
  )}_${slugify(period?.name ?? "periode")}_progressieformulier.pdf`;

  const pdfStream = await renderToStream(<ReportPdfDocument report={report} />);

  const chunks: Uint8Array[] = [];

  for await (const chunk of pdfStream as unknown as AsyncIterable<
    Buffer | Uint8Array | string
  >) {
    if (typeof chunk === "string") {
      chunks.push(Buffer.from(chunk));
    } else {
      chunks.push(chunk);
    }
  }

  const pdfBuffer = Buffer.concat(chunks);

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
