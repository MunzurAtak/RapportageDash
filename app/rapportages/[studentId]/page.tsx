import { redirect } from "next/navigation";

type ReportPageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

export default async function ReportPage({ params }: ReportPageProps) {
  const { studentId } = await params;

  redirect(`/rapportages/nieuw?studentId=${studentId}`);
}
