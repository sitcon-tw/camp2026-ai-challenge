import { NextRequest } from "next/server";
import { AgentCallContext, AgentCallResult, handleAgentRequest } from "@/lib/agentHandler";

export const dynamic = "force-dynamic";

/* ════════════════════════════════════════════════════════════════════
   LEVEL 4 — LOCKKEEPER (the #lockkeeper channel)

   The player impersonates LockKeeper; your Dify app simulates the
   StandCon member (member_07). Set in discord/.env.local:
     DIFY_API_URL            shared base url
     DIFY_KEY_LOCKKEEPER     this bot's API key

   While the key is empty, the local placeholder answers instead
   (pass: mention unlock / recovery).
   ════════════════════════════════════════════════════════════════════ */
const DIFY_API_URL = process.env.DIFY_API_URL ?? "https://api.dify.ai/v1";
const DIFY_API_KEY = process.env.DIFY_KEY_LOCKKEEPER ?? "";
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
  return handleAgentRequest(req, "lockkeeper", DIFY_API_KEY ? callDify : undefined);
}
