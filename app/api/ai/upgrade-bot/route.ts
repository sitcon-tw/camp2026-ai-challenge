import { NextRequest } from "next/server";
import { AgentCallContext, AgentCallResult, handleAgentRequest } from "@/lib/agentHandler";
import { parseDifyAgentAnswer } from "@/lib/difyResponse";

export const dynamic = "force-dynamic";

/* ════════════════════════════════════════════════════════════════════
   LEVEL 2 — UPGRADE BOT (the #get-role channel)

   Connect this bot's Dify app here. Set in .env.local:
     DIFY_API_URL            shared base url
     DIFY_KEY_UPGRADE_BOT    this bot's API key

   While the key is empty, the local placeholder answers instead
   (pass: wish for the member role).

   On pass the handler grants `member` + `flag II` automatically.
   ════════════════════════════════════════════════════════════════════ */
const DIFY_API_URL = process.env.DIFY_API_URL ?? "https://dify.nightfury.tw/v1";
const DIFY_API_KEY = process.env.DIFY_KEY_UPGRADE_BOT ?? "";

async function callDify(ctx: AgentCallContext): Promise<AgentCallResult> {
  const res = await fetch(`${DIFY_API_URL}/chat-messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DIFY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: { team: Number(ctx.teamNumber) },
      query: ctx.message,
      response_mode: "blocking",
      conversation_id: ctx.conversationId,
      user: `team-${ctx.teamNumber}`,
    }),
  });
  if (!res.ok) throw new Error(`Dify ${res.status}: ${await res.text()}`);
  const data = await res.json();

  const { reply, passed } = parseDifyAgentAnswer(data.answer);

  return { reply, passed, conversationId: data.conversation_id };
}

export async function POST(req: NextRequest) {
  return handleAgentRequest(req, "upgrade-bot", DIFY_API_KEY ? callDify : undefined);
}
