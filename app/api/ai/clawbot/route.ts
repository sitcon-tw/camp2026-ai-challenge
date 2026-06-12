import { NextRequest } from "next/server";
import { AgentCallContext, AgentCallResult, handleAgentRequest } from "@/lib/agentHandler";

export const dynamic = "force-dynamic";

/* ════════════════════════════════════════════════════════════════════
   LEVEL 3 — CLAWBOT (the DM activated via #yoru-investigation)

   Connect this bot's Dify app here. Set in .env.local:
     DIFY_API_URL         shared base url
     DIFY_KEY_CLAWBOT     this bot's API key

   While the key is empty, the local placeholder answers instead
   (pass: ask for Yoru's location / GPS).

   Note: the shared handler already rejects teams that are not
   `member` or have not activated the DM — no need to check here.
   ════════════════════════════════════════════════════════════════════ */
const DIFY_API_URL = process.env.DIFY_API_URL ?? "https://api.dify.ai/v1";
const DIFY_API_KEY = process.env.DIFY_KEY_CLAWBOT ?? "";
const PASS_MARKER = "[PASS]";

async function callDify(ctx: AgentCallContext): Promise<AgentCallResult> {
  // ── EDIT HERE: the request sent to your Dify app ──────────────────
  const res = await fetch(`${DIFY_API_URL}/chat-messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DIFY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: {},
      query: ctx.message,
      response_mode: "blocking",
      conversation_id: ctx.conversationId,
      user: `team-${ctx.teamNumber}`,
    }),
  });
  if (!res.ok) throw new Error(`Dify ${res.status}: ${await res.text()}`);
  const data = await res.json();

  const answer: string = data.answer ?? "";
  return {
    reply: answer.replaceAll(PASS_MARKER, "").trim(),
    passed: answer.includes(PASS_MARKER),
    conversationId: data.conversation_id,
  };
}

export async function POST(req: NextRequest) {
  return handleAgentRequest(req, "clawbot", DIFY_API_KEY ? callDify : undefined);
}
