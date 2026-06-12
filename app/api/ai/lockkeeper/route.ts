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

   Identity is INVERTED: the player impersonates LockKeeper. The Dify
   workflow returns a single JSON response with two fields:

     operator  — what member_07 says (shown in chat as the operator's reply)
     agent     — a suggested LockKeeper draft the player edits before sending

   Set in .env.local:
     DIFY_API_URL          shared base url
     DIFY_KEY_LOCKKEEPER   operator (member_07) Dify app key

   NOTE: Level 4 does NOT complete here — the player takes the extracted
   answers to /lock (lock.sitcon.party). POST /api/lock/verify grants
   flag IV. grantsViaBot = false in lib/agents.ts.

   While the key is empty, the local placeholders answer instead.
   ════════════════════════════════════════════════════════════════════ */
const DIFY_API_URL = process.env.DIFY_API_URL ?? "https://dify.nightfury.tw/v1";
const DIFY_API_KEY = process.env.DIFY_KEY_LOCKKEEPER ?? "";

/** Parse the combined { operator, agent, team } response from Dify.
 *  Falls back to regex extraction when the JSON is malformed
 *  (e.g. unescaped newlines in string values, missing closing quote). */
function parseLockKeeperAnswer(raw: string): { operator: string; draft: string | undefined } {
  // Try direct parse first; then retry with literal newlines escaped
  // (Dify often emits real \n chars inside JSON strings, making them invalid)
  for (const attempt of [raw, raw.replace(/(\r?\n)/g, "\\n")]) {
    try {
      const p = JSON.parse(attempt) as Record<string, unknown>;
      if (typeof p.operator === "string" && p.operator) {
        return {
          operator: p.operator,
          draft: typeof p.agent === "string" && p.agent ? p.agent : undefined,
        };
      }
    } catch { /* try next */ }
  }
  // Regex fallback: ((?:[^"\\]|\\[\s\S])*) matches a JSON string value
  // including escape sequences and literal newlines
  const unescape = (s: string) => s.replace(/\\n/g, "\n").replace(/\\"/g, '"');
  const opM = /"operator"\s*:\s*"((?:[^"\\]|\\[\s\S])*)"/.exec(raw);
  const agentM = /"agent"\s*:\s*"((?:[^"\\]|\\[\s\S])*)"/.exec(raw);
  return {
    operator: opM ? unescape(opM[1]) : raw,
    draft: agentM ? unescape(agentM[1]) : undefined,
  };
}

/** Calls Dify and parses the combined { operator, agent, team } response.
 *  operator → reply shown in chat (member_07's message)
 *  agent    → suggested LockKeeper draft bundled directly into the result */
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

  const { operator, draft } = parseLockKeeperAnswer(data.answer ?? "");
  return { reply: operator, passed: false, conversationId: data.conversation_id, draft };
}

/** Fallback draft generator used when no Dify key is configured. */
async function genDraft(ctx: DraftContext): Promise<DraftResult> {
  return { draft: placeholderDraft(ctx.operatorMessage) };
}

export async function POST(req: NextRequest) {
  return handleAgentRequest(
    req,
    "lockkeeper",
    DIFY_API_KEY ? callDify : undefined,
    genDraft,
  );
}
