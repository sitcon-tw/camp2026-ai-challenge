import { NextRequest, NextResponse } from "next/server";
import { getTeamState, initTeam } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const teamNumber = String(body?.teamNumber ?? "").trim();
  if (!teamNumber) {
    return NextResponse.json({ error: "請輸入 teamNumber。" }, { status: 400 });
  }

  const team = await initTeam(teamNumber);
  const state = await getTeamState(team);

  return NextResponse.json({
    teamId: team.teamNumber,
    role: team.roles.includes("member") ? "member" : "newbie",
    completedLevels: state.completedLevels,
    unlockedFlags: state.unlockedFlags,
    availableChannels: state.channels.filter((c) => c.perm !== "s").map((c) => c.id),
    state,
  });
}
