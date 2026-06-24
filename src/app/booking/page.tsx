import { db } from "@/lib/db";
import { branches, services, settings } from "@/lib/db/schema";
import { BookingForm } from "@/components/sections/BookingForm";

export const revalidate = 0;

export const metadata = {
  title: "Reservasi Layanan - Navara Reflexology",
  description: "Pesan jadwal terapi bekam, refleksi, dan medical check up di cabang Navara Reflexology terdekat secara online.",
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;

  const branchList = await db.select().from(branches);
  const serviceList = await db.select().from(services);
  const companySettings = await db.select().from(settings);
  
  const activeBranches = branchList.filter(b => b.isActive);
  const activeServices = serviceList.filter(s => s.isActive);
  const whatsappInfo = companySettings[0]?.whatsappNumber || "6281234567890";

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-primary mb-4">Jadwalkan Terapi Anda</h1>
          <p className="text-foreground/70">Silakan isi formulir di bawah ini. Tim kami akan segera menghubungi Anda via WhatsApp untuk konfirmasi jam dan ketersediaan terapis.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-border p-6 md:p-10">
           <BookingForm 
              branches={activeBranches} 
              services={activeServices} 
              adminWa={whatsappInfo}
              initialBranch={params.branch as string || ""}
              initialService={params.service as string || ""}
           />
        </div>
      </div>
    </div>
  );
}

