import { NextRequest, NextResponse } from "next/server";
import { getTeam, getTeamState } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * GET /api/team/:teamNumber/state
 * Full team state: roles, completed levels, unlocked flags,
 * channels with effective permissions, and the Seadog007 DM.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamNumber: string }> }
) {
  const { teamNumber } = await params;
  const team = getTeam(teamNumber);
  if (!team) {
    return NextResponse.json({ error: "team not found" }, { status: 404 });
  }
  return NextResponse.json(getTeamState(team));
}
