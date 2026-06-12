import { NextRequest, NextResponse } from "next/server";
import { activateClawbot, getChannel, getTeam, getTeamState, permFor } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * POST /api/dm/clawbot/activate  { teamNumber }
 * Triggered by clicking the bot link in #yoru-investigation.
 * Opens the Clawbot DM and makes the bot send its greeting.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const teamNumber = String(body?.teamNumber ?? "");

  const team = getTeam(teamNumber);
  if (!team) return NextResponse.json({ error: "team not found" }, { status: 404 });

  // the link lives in a member-only channel — only members can use it
  const source = getChannel("yoru-investigation");
  if (!source || permFor(team, source) === "s") {
    return NextResponse.json(
      { error: "You do not have permission to use this link." },
      { status: 403 }
    );
  }

  activateClawbot(team);
  return NextResponse.json({ ok: true, state: getTeamState(team) });
}
