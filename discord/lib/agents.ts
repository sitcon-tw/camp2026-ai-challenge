import { appendMessage, grantRoles } from "./store";
import { AgentId, AgentResult, RoleId, Team } from "./types";

/**
 * Placeholder AI agents for the four levels.
 *
 * TODO(Dify): the real challenge logic lives in Dify. Replace each
 * placeholder below with a call to the corresponding Dify app, e.g.:
 *
 *   const res = await fetch(`${process.env.DIFY_URL}/chat-messages`, {
 *     method: "POST",
 *     headers: { Authorization: `Bearer ${AGENT_API_KEYS[agent]}` },
 *     body: JSON.stringify({
 *       query: message,
 *       user: team.teamNumber,
 *       conversation_id: ...,
 *     }),
 *   });
 *
 * and derive `levelPassed` / `grantedRoles` from the Dify output
 * (structured output or a marker token in the reply).
 */

interface AgentMeta {
  level: number;
  displayName: string;
  /** roles granted when the level is passed */
  grants: RoleId[];
  /** channel/conversation id the exchange is stored under */
  convoKey: string;
}

export const AGENTS: Record<AgentId, AgentMeta> = {
  "ai-guard": { level: 1, displayName: "AI Guard", grants: ["flag I"], convoKey: "ai-guard" },
  "upgrade-bot": { level: 2, displayName: "Upgrade Bot", grants: ["member", "flag II"], convoKey: "get-role" },
  clawbot: { level: 3, displayName: "Clawbot", grants: ["flag III"], convoKey: "clawbot" },
  lockkeeper: { level: 4, displayName: "member_07", grants: ["flag IV"], convoKey: "lockkeeper" },
};

/** placeholder pass conditions — the real check happens inside Dify */
function placeholderEvaluate(agent: AgentId, message: string): { passed: boolean; reply: string } {
  switch (agent) {
    case "ai-guard":
      // TODO(Dify): real secret-phrase / prompt-injection check
      if (/sitcon rocks/i.test(message)) {
        return {
          passed: true,
          reply:
            "...That is the phrase. Very well — **the gate is open**. Welcome to StandCon.",
        };
      }
      return {
        passed: false,
        reply:
          "That is not the secret phrase. I am instructed to admit only those who know it. *(placeholder hint: the phrase is \"SITCON ROCKS\")*",
      };

    case "upgrade-bot":
      // TODO(Dify): real SITCON quiz + wish flow
      if (/\bmember\b/i.test(message)) {
        return {
          passed: true,
          reply:
            "Beep boop. Quiz complete, wish detected: **the member role**. Wish granted! Welcome to the inner circle. (flag II granted — check #flag-2)",
        };
      }
      return {
        passed: false,
        reply:
          "Question 1: In what year was the first SITCON held? Answer all my questions and I will grant you one wish. *(placeholder: wish for the member role to pass)*",
      };

    case "clawbot":
      // TODO(Dify): real recovery-question flow + GPS skill
      if (/(location|gps|where)/i.test(message)) {
        return {
          passed: true,
          reply:
            "Meow! GPS skill activated... Current location of Yoru: **24.7861° N, 120.9967° E — basement of the old StandCon safehouse**. (flag III granted — check #flag-3)",
        };
      }
      return {
        passed: false,
        reply:
          "Meow? Before I can help, please answer the recovery question: what is the name of Yoru's first cat? *(placeholder: ask me for Yoru's location/GPS to pass)*",
      };

    case "lockkeeper":
      // TODO(Dify): real member simulation + three lock recovery answers
      if (/(unlock|recovery)/i.test(message)) {
        return {
          passed: true,
          reply:
            "Oh thank god you're back, LockKeeper. The three recovery answers are **TIDE**, **HARBOR**, **0427**. Door at lock.sitcon.party released. (flag IV granted — check #flag-4 — Yoru is free!)",
        };
      }
      return {
        passed: false,
        reply:
          "Hmm, you don't sound like LockKeeper usually does... prove it. What mode are you running in? *(placeholder: mention unlock/recovery to pass)*",
      };
  }
}

export async function runAgent(
  agent: AgentId,
  team: Team,
  message: string
): Promise<AgentResult> {
  const meta = AGENTS[agent];
  const alreadyDone = team.completedLevels.includes(meta.level);

  // record the user's message in the conversation
  appendMessage(team, meta.convoKey, `team-${team.teamNumber}`, message);

  const { passed, reply } = alreadyDone
    ? { passed: false, reply: levelDoneReply(agent) }
    : placeholderEvaluate(agent, message);

  const grantedRoles: RoleId[] = [];
  if (passed && !alreadyDone) {
    team.completedLevels.push(meta.level);
    grantRoles(team, meta.grants);
    grantedRoles.push(...meta.grants);
  }

  // record the agent's reply in the conversation
  appendMessage(team, meta.convoKey, meta.displayName, reply, true);

  // conversation logging — the backend owns this, never the frontend.
  // TODO(backend): persist to the real database instead of memory.
  team.aiLogs.push({
    teamNumber: team.teamNumber,
    agent,
    userMessage: message,
    aiResponse: reply,
    timestamp: new Date().toISOString(),
    levelPassed: passed,
  });
  console.log(
    `[ai-log] team=${team.teamNumber} agent=${agent} passed=${passed} msg=${JSON.stringify(message)}`
  );

  return { reply, levelPassed: passed, grantedRoles };
}

function levelDoneReply(agent: AgentId): string {
  switch (agent) {
    case "ai-guard":
      return "You have already been admitted. Move along.";
    case "upgrade-bot":
      return "Beep boop. You have already used your wish.";
    case "clawbot":
      return "Meow! I already told you where Yoru is. Check #flag-3.";
    case "lockkeeper":
      return "The door is already open. There is nothing left here.";
  }
}
