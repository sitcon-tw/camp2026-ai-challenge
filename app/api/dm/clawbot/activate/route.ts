import { NextRequest, NextResponse } from "next/server";
import { activateClawbot, getChannel, getTeam, getTeamState, permFor } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const teamNumber = String(body?.teamNumber ?? "");

  const team = await getTeam(teamNumber);
  if (!team) return NextResponse.json({ error: "找不到隊伍。" }, { status: 404 });

  const source = getChannel("yoru-investigation");
  if (!source || permFor(team, source) === "s") {
    return NextResponse.json(
      { error: "你沒有權限使用這個連結。" },
      { status: 403 }
    );
  }

  await activateClawbot(team);
  return NextResponse.json({ ok: true, state: await getTeamState(team) });
}
