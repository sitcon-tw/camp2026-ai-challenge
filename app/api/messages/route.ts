import { NextRequest, NextResponse } from "next/server";
import { appendMessage, getChannel, getTeam, messagesFor, permFor } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const teamNumber = req.nextUrl.searchParams.get("teamNumber") ?? "";
  const channelId = req.nextUrl.searchParams.get("channelId") ?? "";

  const team = await getTeam(teamNumber);
  if (!team) return NextResponse.json({ error: "找不到隊伍。" }, { status: 404 });
  const channel = getChannel(channelId);
  if (!channel) return NextResponse.json({ error: "找不到頻道。" }, { status: 404 });

  if (permFor(team, channel) === "s") {
    return NextResponse.json(
      { error: "你沒有權限讀取這個頻道。", requiredRole: channel.requiredRole },
      { status: 403 }
    );
  }

  return NextResponse.json({ messages: await messagesFor(team, channelId) });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const teamNumber = String(body?.teamNumber ?? "");
  const channelId = String(body?.channelId ?? "");
  const content = String(body?.content ?? "").trim();

  const team = await getTeam(teamNumber);
  if (!team) return NextResponse.json({ error: "找不到隊伍。" }, { status: 404 });
  const channel = getChannel(channelId);
  if (!channel) return NextResponse.json({ error: "找不到頻道。" }, { status: 404 });
  if (!content) return NextResponse.json({ error: "訊息不能是空的。" }, { status: 400 });

  if (permFor(team, channel) !== "w") {
    return NextResponse.json(
      { error: "你沒有權限在這個頻道寫入訊息。" },
      { status: 403 }
    );
  }
  if (channel.type === "ai") {
    return NextResponse.json(
      { error: `Use POST /api/ai/${channel.agent} for AI channels.` },
      { status: 400 }
    );
  }

  const message = await appendMessage(team, channelId, `team-${team.teamNumber}`, content);
  return NextResponse.json({ message });
}
