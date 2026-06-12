import { NextRequest, NextResponse } from "next/server";
import { activateLockkeeper, getTeam, getTeamState } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * POST /api/dm/lockkeeper/activate  { teamNumber }
 * Triggered by clicking the LockKeeper link in Seadog's DM (Level 4).
 * Opens the intercepted LockKeeper channel — the player now impersonates
 * the bot and a StandCon operator connects on the other end.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const teamNumber = String(body?.teamNumber ?? "");

  const team = await getTeam(teamNumber);
  if (!team) return NextResponse.json({ error: "找不到隊伍。" }, { status: 404 });

  // the link is only sent after Level 3 — guard it server-side too
  if (!team.completedLevels.includes(3)) {
    return NextResponse.json(
      { error: "請先找到 Yoru 的位置（Level 3），才能攔截這個 channel。" },
      { status: 403 }
    );
  }

  await activateLockkeeper(team);
  return NextResponse.json({ ok: true, state: await getTeamState(team) });
}
