import TherapistCommissionsClientPage from "./client";

export default async function TherapistCommissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TherapistCommissionsClientPage therapistId={id} />;
}
