import { NextRequest, NextResponse } from "next/server";
import { getTeam, getTeamState, resetTeam } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ teamNumber: string }> }
) {
  const { teamNumber } = await params;
  const team = await getTeam(teamNumber);
  if (!team) {
    return NextResponse.json({ error: "找不到隊伍。" }, { status: 404 });
  }
  await resetTeam(team);
  return NextResponse.json({ ok: true, state: await getTeamState(team) });
}
