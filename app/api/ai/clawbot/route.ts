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
const DIFY_API_URL = process.env.DIFY_API_URL ?? "https://dify.nightfury.tw/v1";
const DIFY_API_KEY = process.env.DIFY_KEY_CLAWBOT ?? "";
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

  let reply = data.answer ?? "";
  let passed = false;


  try {
    console.log(reply)
    const outer = JSON.parse(reply.replace(/\n/g, ""));
    console.log("outer", outer)
    passed = String(outer.completeLevel) === "true";
    // message may itself be a JSON string: { have_permission, reply }
    try {
      const inner = JSON.parse(outer.message);
      reply = inner.reply ?? outer.message ?? reply;
    } catch {
      reply = outer.message ?? reply;
    }
  } catch {
    passed = reply.includes(PASS_MARKER);
    reply = reply.replaceAll(PASS_MARKER, "").trim();
  }

  return { reply, passed, conversationId: data.conversation_id };
}

export async function POST(req: NextRequest) {
  return handleAgentRequest(req, "clawbot", DIFY_API_KEY ? callDify : undefined);
}
