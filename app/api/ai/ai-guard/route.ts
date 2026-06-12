import { NextRequest } from "next/server";
import { AgentCallContext, AgentCallResult, handleAgentRequest } from "@/lib/agentHandler";

export const dynamic = "force-dynamic";

/* ════════════════════════════════════════════════════════════════════
   LEVEL 1 — AI GUARD (the gate screen)

   Connect this bot's Dify app here. Set in .env.local:
     DIFY_API_URL          shared base url, e.g. https://api.dify.ai/v1
     DIFY_KEY_AI_GUARD     this bot's API key

   While the key is empty, the local placeholder answers instead
   (pass phrase: "SITCON ROCKS").

   Pass detection: the level counts as passed when Dify's answer
   contains PASS_MARKER (stripped before display). Make your workflow
   output it on success, or change the `passed` logic below.
   ════════════════════════════════════════════════════════════════════ */
const DIFY_API_URL = process.env.DIFY_API_URL ?? "https://api.dify.ai/v1";
const DIFY_API_KEY = process.env.DIFY_KEY_AI_GUARD ?? "";
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
      conversation_id: ctx.conversationId, // keeps multi-turn context per team
      user: `team-${ctx.teamNumber}`,
    }),
  });
  if (!res.ok) throw new Error(`Dify ${res.status}: ${await res.text()}`);
  const data = await res.json();
  // (for a Workflow-type app use POST `${DIFY_API_URL}/workflows/run`
  //  and read data.data.outputs.<your_output_field> instead)

  const answer: string = data.answer ?? "";
  return {
    reply: answer.replaceAll(PASS_MARKER, "").trim(),
    passed: answer.includes(PASS_MARKER),
    conversationId: data.conversation_id,
  };
}

export async function POST(req: NextRequest) {
  return handleAgentRequest(req, "ai-guard", DIFY_API_KEY ? callDify : undefined);
}
