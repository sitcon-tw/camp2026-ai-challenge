import { NextRequest } from "next/server";
import {
  AgentCallContext,
  AgentCallResult,
  DraftContext,
  DraftResult,
  handleAgentRequest,
} from "@/lib/agentHandler";
import { placeholderDraft } from "@/lib/agents";

export const dynamic = "force-dynamic";

/* ════════════════════════════════════════════════════════════════════
   LEVEL 4 — LOCKKEEPER (a DM the player hijacks, not a channel)

   Identity is INVERTED: the player impersonates LockKeeper. But instead
   of writing "like an LLM" from scratch, the backend SUGGESTS a
   LockKeeper-style draft (see genDraft below) that the player edits and
   sends. So there are two AI roles here:

     callDify  → the StandCon operator (member_07) being socially
                 engineered; its replies should leak the three
                 Safehouse-04 recovery answers.
     genDraft  → the suggested LockKeeper message the player edits next.

   Set in .env.local:
     DIFY_API_URL                 shared base url
     DIFY_KEY_LOCKKEEPER          operator (member_07) app key
     DIFY_KEY_LOCKKEEPER_DRAFT    (optional) LockKeeper draft-writer key

   NOTE: Level 4 does NOT complete here. There is no [PASS] for this bot —
   the player takes the extracted answers to /lock (lock.sitcon.party),
   and POST /api/lock/verify grants flag IV. The `passed` flag below is
   ignored for lockkeeper (grantsViaBot = false in lib/agents.ts).

   While a key is empty, the local placeholders answer instead.
   ════════════════════════════════════════════════════════════════════ */
const DIFY_API_URL = process.env.DIFY_API_URL ?? "https://api.dify.ai/v1";
const DIFY_API_KEY = process.env.DIFY_KEY_LOCKKEEPER ?? "";
const DIFY_DRAFT_KEY = process.env.DIFY_KEY_LOCKKEEPER_DRAFT ?? "";
const PASS_MARKER = "[PASS]";

/** the operator (member_07) reply to the player's (edited) LockKeeper message */
async function callDify(ctx: AgentCallContext): Promise<AgentCallResult> {
  // ── EDIT HERE: the request sent to your operator Dify app ─────────
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

/** suggest the next LockKeeper draft the player edits & sends. Receives the
 *  operator's latest reply as ctx.operatorMessage. Falls back to the local
 *  placeholder when DIFY_KEY_LOCKKEEPER_DRAFT is unset. */
async function genDraft(ctx: DraftContext): Promise<DraftResult> {
  if (!DIFY_DRAFT_KEY) {
    return { draft: placeholderDraft(ctx.operatorMessage) };
  }
  // ── EDIT HERE: the request sent to your draft-writer Dify app ─────
  const res = await fetch(`${DIFY_API_URL}/chat-messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DIFY_DRAFT_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: {},
      query: ctx.operatorMessage,
      response_mode: "blocking",
      conversation_id: ctx.conversationId,
      user: `team-${ctx.teamNumber}`,
    }),
  });
  if (!res.ok) throw new Error(`Dify ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { draft: (data.answer ?? "").trim(), conversationId: data.conversation_id };
}

export async function POST(req: NextRequest) {
  return handleAgentRequest(
    req,
    "lockkeeper",
    DIFY_API_KEY ? callDify : undefined,
    genDraft
  );
}
