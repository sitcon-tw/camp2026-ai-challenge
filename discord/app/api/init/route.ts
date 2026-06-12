import { NextRequest, NextResponse } from "next/server";
import { getTeamState, initTeam } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * POST /api/init  { teamNumber }
 * Creates or loads the team and returns its initial state.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const teamNumber = String(body?.teamNumber ?? "").trim();
  if (!teamNumber) {
    return NextResponse.json({ error: "teamNumber is required" }, { status: 400 });
  }

  const team = initTeam(teamNumber);
  const state = getTeamState(team);

  // response shape from the spec, plus the full state so the client
  // can render immediately without a second request
  return NextResponse.json({
    teamId: team.teamNumber,
    role: team.roles.includes("member") ? "member" : "newbie",
    completedLevels: state.completedLevels,
    unlockedFlags: state.unlockedFlags,
    availableChannels: state.channels.filter((c) => c.perm !== "s").map((c) => c.id),
    state,
  });
}
