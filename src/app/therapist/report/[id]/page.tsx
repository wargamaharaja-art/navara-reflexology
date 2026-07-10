import TherapistReportClientPage from "./client";

export default async function TherapistReportViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TherapistReportClientPage reportId={id} />;
}
