import { HealthCheck } from "@/components/sections/HealthCheck";

export const metadata = {
  title: "Cek Kesehatan Gratis - Navara Reflexology",
  description: "Cek tingkat stres, BMI, risiko diabetes, dan serangan jantung Anda secara gratis. Dapatkan rekomendasi pengobatan yang tepat dari Navara Reflexology.",
};

export default function CekKesehatanPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <HealthCheck />
    </div>
  );
}
