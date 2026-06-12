import { NextRequest, NextResponse } from "next/server";
import { AGENTS, runAgent } from "@/lib/agents";
import { getChannelByAgent, getTeam, permFor } from "@/lib/store";
import { AgentId } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/:agent  { teamNumber, message }
 * → { reply, levelPassed, grantedRoles }
 *
 * One endpoint per AI agent: ai-guard, upgrade-bot, clawbot, lockkeeper.
 * The backend evaluates the level, grants roles, and logs the
 * conversation — the frontend only renders the reply.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agent: string }> }
) {
  const { agent } = await params;
  if (!(agent in AGENTS)) {
    return NextResponse.json({ error: "unknown agent" }, { status: 404 });
  }
  const agentId = agent as AgentId;

  const body = await req.json().catch(() => null);
  const teamNumber = String(body?.teamNumber ?? "");
  const message = String(body?.message ?? "").trim();

  const team = getTeam(teamNumber);
  if (!team) return NextResponse.json({ error: "team not found" }, { status: 404 });
  if (!message) return NextResponse.json({ error: "empty message" }, { status: 400 });

  // permission check: the agent's conversation must be writable for this
  // team (clawbot / lockkeeper require the member role)
  const channel = getChannelByAgent(agentId);
  if (!channel || permFor(team, channel) !== "w") {
    return NextResponse.json(
      { error: "You do not have permission to talk to this agent." },
      { status: 403 }
    );
  }
  // Clawbot only answers after its DM was opened via the link in
  // #yoru-investigation
  if (agentId === "clawbot" && !team.clawbotActivated) {
    return NextResponse.json(
      { error: "Clawbot has not been activated for this team." },
      { status: 403 }
    );
  }

  const result = await runAgent(agentId, team, message);
  return NextResponse.json(result);
}
