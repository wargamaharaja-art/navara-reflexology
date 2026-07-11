import { db } from "@/lib/db";
import { reservations, branches, services, therapists, patientVisits, patients } from "@/lib/db/schema";
import { desc, eq, and, gte, lte } from "drizzle-orm";
import { getActiveBranchFilter, getSession } from "@/lib/auth";
import ReservationsClient from "./ReservationsClient";

export const metadata = {
  title: "Kelola Reservasi - Admin Navara Reflexology",
};

export default async function AdminReservationsPage() {
  const branchFilter = await getActiveBranchFilter();

  // Load active therapists of this branch or all active therapists if no branch filter
  const therapistConditions = [eq(therapists.isActive, true)];
  if (branchFilter) {
    therapistConditions.push(eq(therapists.branchId, branchFilter));
  }
  const activeTherapists = await db.select().from(therapists).where(and(...therapistConditions));

  // Load reservations
  let query = db
    .select({
      res: reservations,
      branchName: branches.name,
      serviceName: services.name,
    })
    .from(reservations)
    .leftJoin(branches, eq(reservations.branchId, branches.id))
    .leftJoin(services, eq(reservations.serviceId, services.id));

  if (branchFilter) {
    query = query.where(eq(reservations.branchId, branchFilter)) as any;
  }

  const data = await query.orderBy(desc(reservations.createdAt));

  const pendingCount = data.filter(d => d.res.status === "PENDING").length;

  // Load recent patient visits for the calendar (last 30 days and next 30 days roughly)
  let visitsQuery = db
    .select({
      id: patientVisits.id,
      visitDate: patientVisits.visitDate,
      visitTime: patientVisits.visitTime,
      status: patientVisits.status,
      branchId: patientVisits.branchId,
      patientName: patients.name,
      serviceName: services.name,
      therapistName: therapists.name,
    })
    .from(patientVisits)
    .leftJoin(patients, eq(patientVisits.patientId, patients.id))
    .leftJoin(services, eq(patientVisits.serviceId, services.id))
    .leftJoin(therapists, eq(patientVisits.therapistId, therapists.id));

  if (branchFilter) {
    visitsQuery = visitsQuery.where(eq(patientVisits.branchId, branchFilter)) as any;
  }

  const visitsData = await visitsQuery;

  const session = await getSession();
  const allBranches = await db.select().from(branches);

  return (
    <ReservationsClient 
      data={data} 
      activeTherapists={activeTherapists} 
      pendingCount={pendingCount} 
      visits={visitsData} 
      session={session}
      branches={allBranches}
    />
  );
}
