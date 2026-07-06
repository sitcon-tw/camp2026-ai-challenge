import { NextRequest, NextResponse } from "next/server";
import { FLAG_PLACEHOLDERS, getTeam, grantRoles, markLevelCompleted } from "@/lib/store";

export const dynamic = "force-dynamic";

/*
   Safehouse-04 remote lock - answer verification (Level 4 completion)

   DEMO answers. Replace these (and the questions in lib/lock.ts) before
   the event, and keep them in sync with the LockKeeper / Operator #67 Dify
   prompt; the operator is the one who reveals them in the DM.

   Matching is case-insensitive and whitespace-trimmed.
 */
const LOCK_ANSWERS: Record<string, string> = {
  q1: "我真的會謝",
  q2: "拜託不要炸",
  q3: "race condition",
};

const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();

/**
 * POST /api/lock/verify  { teamNumber, answers: { q1, q2, q3 } }
 * Checks the three recovery answers. On success, completes Level 4 and
 * grants flag IV for the team, then returns the flag text.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const teamNumber = String(body?.teamNumber ?? "").trim();
  const answers = (body?.answers ?? {}) as Record<string, string>;

  if (!teamNumber) {
    return NextResponse.json({ ok: false, error: "請輸入隊伍編號。" }, { status: 400 });
  }

  const team = await getTeam(teamNumber);
  if (!team) {
    return NextResponse.json(
      { ok: false, error: "找不到這個隊伍編號。" },
      { status: 404 }
    );
  }

  // Return which fields are wrong so the UI can highlight them, without
  // leaking the correct values.
  const wrong = Object.keys(LOCK_ANSWERS).filter(
    (id) => norm(answers[id]) !== norm(LOCK_ANSWERS[id])
  );
  if (wrong.length > 0) {
    return NextResponse.json(
      { ok: false, error: "恢復答案被拒絕。門鎖仍然封鎖。", wrong },
      { status: 200 }
    );
  }

  const alreadyDone = team.completedLevels.includes(4);
  if (!alreadyDone) {
    await markLevelCompleted(team, 4);
    await grantRoles(team, ["flag IV"]);
  }

  return NextResponse.json({
    ok: true,
    alreadyDone,
    flag: FLAG_PLACEHOLDERS[4],
  });
}
