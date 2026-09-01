import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customerFeedbacks, branches, therapists } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getSession, getActiveBranchFilter } from "@/lib/auth";
import { ensureFeedbackTable } from "@/lib/db/feedback-init";

export async function GET(request: Request) {
  try {
    await ensureFeedbackTable();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const branchFilter = await getActiveBranchFilter();
    const queryBranchId = searchParams.get("branchId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const conditions = [];

    const effectiveBranch = branchFilter || (queryBranchId && queryBranchId !== "ALL" ? queryBranchId : null);
    if (effectiveBranch) {
      conditions.push(eq(customerFeedbacks.branchId, effectiveBranch));
    }

    if (startDate) {
      conditions.push(gte(customerFeedbacks.createdAt, `${startDate}T00:00:00`));
    }
    if (endDate) {
      conditions.push(lte(customerFeedbacks.createdAt, `${endDate}T23:59:59`));
    }

    const feedbacks = await db
      .select({
        feedback: customerFeedbacks,
        branchName: branches.name,
        therapistName: therapists.name,
      })
      .from(customerFeedbacks)
      .leftJoin(branches, eq(customerFeedbacks.branchId, branches.id))
      .leftJoin(therapists, eq(customerFeedbacks.therapistId, therapists.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalCount = feedbacks.length;
    const submitted = feedbacks.filter((f: any) => f.feedback.status === "SUBMITTED" || f.feedback.status === "FLAGGED");
    const pendingCount = feedbacks.filter((f: any) => f.feedback.status === "PENDING").length;
    const submittedCount = submitted.length;

    // Averages
    const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

    const overallRatings = submitted.map((f: any) => f.feedback.overallRating).filter((r: any): r is number => r !== null && r !== undefined);
    const therapistRatings = submitted.map((f: any) => f.feedback.therapistRating).filter((r: any): r is number => r !== null && r !== undefined);
    const facilityRatings = submitted.map((f: any) => f.feedback.facilityRating).filter((r: any): r is number => r !== null && r !== undefined);
    const serviceRatings = submitted.map((f: any) => f.feedback.serviceRating).filter((r: any): r is number => r !== null && r !== undefined);
    const valueRatings = submitted.map((f: any) => f.feedback.valueRating).filter((r: any): r is number => r !== null && r !== undefined);

    const avgOverall = avg(overallRatings);
    const avgTherapist = avg(therapistRatings);
    const avgFacility = avg(facilityRatings);
    const avgService = avg(serviceRatings);
    const avgValue = avg(valueRatings);

    // Would recommend
    const recommendAnswers = submitted.map((f: any) => f.feedback.wouldRecommend).filter((r: any): r is boolean => typeof r === "boolean");
    const recommendYes = recommendAnswers.filter((r: any) => r === true).length;
    const recommendRate = recommendAnswers.length > 0 ? Math.round((recommendYes / recommendAnswers.length) * 100) : 0;

    // Star Distribution (1-5)
    const starDistribution = [1, 2, 3, 4, 5].map((star: number) => {
      const count = overallRatings.filter((r: any) => r === star).length;
      const percentage = overallRatings.length > 0 ? Math.round((count / overallRatings.length) * 100) : 0;
      return { star, count, percentage };
    });

    // Therapist Ranking
    const therapistMap: Record<string, { id: string; name: string; count: number; ratings: number[] }> = {};
    submitted.forEach((f: any) => {
      if (f.feedback.therapistId && f.therapistName && f.feedback.therapistRating) {
        const tid = f.feedback.therapistId;
        if (!therapistMap[tid]) {
          therapistMap[tid] = { id: tid, name: f.therapistName, count: 0, ratings: [] };
        }
        therapistMap[tid].count += 1;
        therapistMap[tid].ratings.push(f.feedback.therapistRating);
      }
    });

    const therapistRanking = Object.values(therapistMap).map((t: any) => ({
      id: t.id,
      name: t.name,
      reviewCount: t.count,
      averageRating: Number(avg(t.ratings).toFixed(1)),
    })).sort((a: any, b: any) => b.averageRating - a.averageRating || b.reviewCount - a.reviewCount);

    // Aspect breakdown (Cleanliness, Friendliness, Punctuality, etc.)
    const aspectTotals: Record<string, number[]> = {
      cleanliness: [],
      friendliness: [],
      punctuality: [],
      comfort: [],
      technique: [],
    };

    submitted.forEach((f: any) => {
      if (f.feedback.aspectRatings) {
        try {
          const parsed = JSON.parse(f.feedback.aspectRatings);
          Object.keys(aspectTotals).forEach(key => {
            if (typeof parsed[key] === "number" && parsed[key] > 0) {
              aspectTotals[key].push(parsed[key]);
            }
          });
        } catch {
          // ignore
        }
      }
    });

    const aspectAverages = Object.entries(aspectTotals).map(([key, list]) => ({
      key,
      label:
        key === "cleanliness" ? "Kebersihan" :
        key === "friendliness" ? "Keramahan Staff" :
        key === "punctuality" ? "Ketepatan Waktu" :
        key === "comfort" ? "Kenyamanan Ruangan" :
        key === "technique" ? "Kualitas Terapi" : key,
      average: Number(avg(list).toFixed(1)),
      count: list.length,
    }));

    // Weekly / Monthly Trend (Last 7 days or Last 30 days)
    const dailyMap: Record<string, { date: string; count: number; sum: number }> = {};
    submitted.forEach((f: any) => {
      const dateStr = f.feedback.submittedAt ? f.feedback.submittedAt.split("T")[0] : f.feedback.createdAt.split("T")[0];
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { date: dateStr, count: 0, sum: 0 };
      }
      dailyMap[dateStr].count += 1;
      dailyMap[dateStr].sum += f.feedback.overallRating || 0;
    });

    const trendData = Object.values(dailyMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        date: d.date,
        count: d.count,
        avgRating: Number((d.sum / d.count).toFixed(1)),
      }));

    return NextResponse.json({
      success: true,
      summary: {
        totalCount,
        submittedCount,
        pendingCount,
        avgOverall: Number(avgOverall.toFixed(1)),
        avgTherapist: Number(avgTherapist.toFixed(1)),
        avgFacility: Number(avgFacility.toFixed(1)),
        avgService: Number(avgService.toFixed(1)),
        avgValue: Number(avgValue.toFixed(1)),
        recommendRate,
        recommendCount: recommendAnswers.length,
        starDistribution,
        therapistRanking,
        aspectAverages,
        trendData,
      },
    });
  } catch (error: any) {
    console.error("GET /api/feedback/summary error:", error);
    return NextResponse.json({ error: "Gagal memuat ringkasan feedback" }, { status: 500 });
  }
}
