import { db } from "@/lib/db";
import { systemLogs } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

export async function logSystemAction(
  action: string,
  entityType: string,
  entityId: string,
  details?: string
): Promise<void> {
  try {
    const session = await getSession();
    if (!session) {
      console.warn("Attempted to log system action without an active session");
      return;
    }

    await db.insert(systemLogs).values({
      id: crypto.randomUUID(),
      userId: session.id,
      userName: session.name,
      action,
      entityType,
      entityId,
      details,
    });
  } catch (error) {
    // We don't want logger failure to break the main transaction, just log to console
    console.error("Failed to insert system log:", error);
  }
}
