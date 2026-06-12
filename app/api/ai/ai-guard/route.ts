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

  // The bot returns a JSON string: { message, completeLevel, team }
  let reply = data.answer ?? "";
  let passed = false;
  try {
    const parsed = JSON.parse(data.answer);
    reply = parsed.message ?? reply;
    passed = String(parsed.completeLevel) === "true";
  } catch {
    // answer is plain text — fall back to PASS_MARKER
    passed = reply.includes(PASS_MARKER);
    reply = reply.replaceAll(PASS_MARKER, "").trim();
  }

  return { reply, passed, conversationId: data.conversation_id };
}

export async function POST(req: NextRequest) {
  return handleAgentRequest(req, "ai-guard", DIFY_API_KEY ? callDify : undefined);
}
