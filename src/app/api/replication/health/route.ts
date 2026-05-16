import { NextResponse } from "next/server";
import { getReplicationHealth } from "@/lib/replication";

export async function GET() {
  const health = await getReplicationHealth();
  return NextResponse.json(health, { status: health.healthy ? 200 : 503 });
}
