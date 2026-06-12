import { NextRequest, NextResponse } from "next/server";
import { getTeam, getTeamState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamNumber: string }> }
) {
  const { teamNumber } = await params;
  const team = await getTeam(teamNumber);
  if (!team) {
    return NextResponse.json({ error: "team not found" }, { status: 404 });
  }
  return NextResponse.json(await getTeamState(team));
}
