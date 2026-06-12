import { NextRequest, NextResponse } from "next/server";
import { activateClawbot, getChannel, getTeam, getTeamState, permFor } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const teamNumber = String(body?.teamNumber ?? "");

  const team = await getTeam(teamNumber);
  if (!team) return NextResponse.json({ error: "team not found" }, { status: 404 });

  const source = getChannel("yoru-investigation");
  if (!source || permFor(team, source) === "s") {
    return NextResponse.json(
      { error: "You do not have permission to use this link." },
      { status: 403 }
    );
  }

  await activateClawbot(team);
  return NextResponse.json({ ok: true, state: await getTeamState(team) });
}
