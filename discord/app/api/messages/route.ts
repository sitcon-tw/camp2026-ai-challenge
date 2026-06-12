import { NextRequest, NextResponse } from "next/server";
import { appendMessage, getChannel, getTeam, messagesFor, permFor } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * GET /api/messages?teamNumber=&channelId=
 * Channel messages (static seed + per-team). 403 if the team only has
 * "s" (see-only) permission on the channel.
 */
export async function GET(req: NextRequest) {
  const teamNumber = req.nextUrl.searchParams.get("teamNumber") ?? "";
  const channelId = req.nextUrl.searchParams.get("channelId") ?? "";

  const team = getTeam(teamNumber);
  if (!team) return NextResponse.json({ error: "team not found" }, { status: 404 });
  const channel = getChannel(channelId);
  if (!channel) return NextResponse.json({ error: "channel not found" }, { status: 404 });

  if (permFor(team, channel) === "s") {
    return NextResponse.json(
      { error: "You do not have permission to read this channel.", requiredRole: channel.requiredRole },
      { status: 403 }
    );
  }

  return NextResponse.json({ messages: messagesFor(team, channelId) });
}

/**
 * POST /api/messages  { teamNumber, channelId, content }
 * Posts to a normal writable channel. AI channels go through
 * POST /api/ai/:agent instead.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const teamNumber = String(body?.teamNumber ?? "");
  const channelId = String(body?.channelId ?? "");
  const content = String(body?.content ?? "").trim();

  const team = getTeam(teamNumber);
  if (!team) return NextResponse.json({ error: "team not found" }, { status: 404 });
  const channel = getChannel(channelId);
  if (!channel) return NextResponse.json({ error: "channel not found" }, { status: 404 });
  if (!content) return NextResponse.json({ error: "empty message" }, { status: 400 });

  if (permFor(team, channel) !== "w") {
    return NextResponse.json(
      { error: "You do not have permission to write in this channel." },
      { status: 403 }
    );
  }
  if (channel.type === "ai") {
    return NextResponse.json(
      { error: `Use POST /api/ai/${channel.agent} for AI channels.` },
      { status: 400 }
    );
  }

  const message = appendMessage(team, channelId, `team-${team.teamNumber}`, content);
  return NextResponse.json({ message });
}
