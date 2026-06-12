import { NextRequest } from "next/server";
import { AgentCallContext, AgentCallResult, handleAgentRequest } from "@/lib/agentHandler";

export const dynamic = "force-dynamic";

/* ════════════════════════════════════════════════════════════════════
   LEVEL 4 — LOCKKEEPER (a DM the player hijacks, not a channel)

   Identity is INVERTED: the player impersonates LockKeeper, so their
   messages are this conversation's "query". Your Dify app plays the
   StandCon operator (member_07) who is being socially engineered, and
   its replies should leak the three Safehouse-04 recovery answers.

   Set in discord/.env.local:
     DIFY_API_URL            shared base url
     DIFY_KEY_LOCKKEEPER     this bot's API key

   NOTE: Level 4 does NOT complete here. There is no [PASS] for this bot —
   the player takes the extracted answers to /lock (lock.sitcon.party),
   and POST /api/lock/verify grants flag IV. The `passed` flag below is
   ignored for lockkeeper (grantsViaBot = false in lib/agents.ts).

   While the key is empty, the local placeholder operator answers instead.
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
