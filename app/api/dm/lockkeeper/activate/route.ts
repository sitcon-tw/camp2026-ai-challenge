import { NextRequest, NextResponse } from "next/server";
import {
  activateLockkeeper,
  appendMessage,
  getTeam,
  getTeamState,
  saveDifyConversations,
  setLockkeeperDraft,
} from "@/lib/store";
import { LOCKKEEPER_OPENING_DRAFT } from "@/lib/agents";

export const dynamic = "force-dynamic";

const DIFY_API_URL = process.env.DIFY_API_URL ?? "https://dify.nightfury.tw/v1";
const DIFY_API_KEY = process.env.DIFY_KEY_LOCKKEEPER ?? "";

/** Same parser used in the main lockkeeper route. */
function parseLockKeeperAnswer(raw: string): { operator: string; draft: string | undefined } {
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
  const unescape = (s: string) => s.replace(/\\n/g, "\n").replace(/\\"/g, '"');
  const opM = /"operator"\s*:\s*"((?:[^"\\]|\\[\s\S])*)"/.exec(raw);
  const agentM = /"agent"\s*:\s*"((?:[^"\\]|\\[\s\S])*)"/.exec(raw);
  return {
    operator: opM ? unescape(opM[1]) : raw,
    draft: agentM ? unescape(agentM[1]) : undefined,
  };
}

/**
 * POST /api/dm/lockkeeper/activate  { teamNumber }
 * Triggered by clicking the LockKeeper link in Seadog's DM (Level 4).
 * Silently sends the opening draft to Dify, then shows only the operator's
 * response in chat and pre-fills the agent draft for the player to edit.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const teamNumber = String(body?.teamNumber ?? "");

  const team = await getTeam(teamNumber);
  if (!team) return NextResponse.json({ error: "找不到隊伍。" }, { status: 404 });

  if (!team.completedLevels.includes(3)) {
    return NextResponse.json(
      { error: "請先找到 Yoru 的位置（第 3 關），才能攔截這個頻道。" },
      { status: 403 }
    );
  }

  await activateLockkeeper(team);

  // Silently trigger Dify with the opening draft to get the operator's first
  // message and the next suggested draft — neither the trigger nor an error
  // is shown as a chat message; we always fall back gracefully.
  let operatorMessage =
    "LockKeeper？控制台剛剛標記你：*記憶資料異常，緊急恢復模式*。我需要在交班前恢復 Safehouse-04 門鎖。你現在穩定到可以執行驗證嗎？";
  let draft = LOCKKEEPER_OPENING_DRAFT;

  if (DIFY_API_KEY) {
    try {
      const res = await fetch(`${DIFY_API_URL}/chat-messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DIFY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: { team: Number(teamNumber) },
          query: LOCKKEEPER_OPENING_DRAFT,
          response_mode: "blocking",
          conversation_id: "",
          user: `team-${teamNumber}`,
        }),
      });
      if (!res.ok) throw new Error(`Dify ${res.status}`);
      const data = await res.json();
      const parsed = parseLockKeeperAnswer(data.answer ?? "");
      operatorMessage = parsed.operator;
      draft = parsed.draft ?? LOCKKEEPER_OPENING_DRAFT;
      if (data.conversation_id) {
        team.difyConversations ??= {};
        team.difyConversations["lockkeeper"] = data.conversation_id;
        await saveDifyConversations(team);
      }
    } catch (err) {
      console.error("[lockkeeper-activate] Dify call failed:", err);
      // fallbacks are already set above
    }
  }

  // Only the operator's response is shown in chat — the trigger is silent.
  await appendMessage(team, "lockkeeper", "Operator #67", operatorMessage, false);
  await setLockkeeperDraft(team, draft);

  return NextResponse.json({ ok: true, state: await getTeamState(team) });
}
