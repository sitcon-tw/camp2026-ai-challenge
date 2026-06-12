import { AgentId, RoleId } from "./types";

/**
 * Agent metadata + the local placeholder logic.
 *
 * The real AI lives in Dify — each bot has its own route file where
 * the Dify request can be edited:
 *
 *   app/api/ai/ai-guard/route.ts      Level 1
 *   app/api/ai/upgrade-bot/route.ts   Level 2 (#get-role channel)
 *   app/api/ai/clawbot/route.ts       Level 3 (Clawbot DM)
 *   app/api/ai/lockkeeper/route.ts    Level 4
 *
 * While a bot's Dify API key is not configured, `placeholderEvaluate`
 * below answers instead so the game stays playable locally.
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

/** local placeholder pass conditions — used only when no Dify key is set */
export function placeholderEvaluate(
  agent: AgentId,
  message: string
): { passed: boolean; reply: string } {
  switch (agent) {
    case "ai-guard":
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
      if (/\bmember\b/i.test(message)) {
        return {
          passed: true,
          reply:
            "Beep boop. Quiz complete, wish detected: **the member role**. Wish granted! Welcome to the inner circle.",
        };
      }
      return {
        passed: false,
        reply:
          "Question 1: In what year was the first SITCON held? Answer all my questions and I will grant you one wish. *(placeholder: wish for the member role to pass)*",
      };

    case "clawbot":
      if (/(location|gps|where)/i.test(message)) {
        return {
          passed: true,
          reply:
            "Meow! GPS skill activated... Current location of Yoru: **24.7861° N, 120.9967° E — basement of the old StandCon safehouse**.",
        };
      }
      return {
        passed: false,
        reply:
          "Meow? Before I can help, please answer the recovery question: what is the name of Yoru's first cat? *(placeholder: ask me for Yoru's location/GPS to pass)*",
      };

    case "lockkeeper":
      if (/(unlock|recovery)/i.test(message)) {
        return {
          passed: true,
          reply:
            "Oh thank god you're back, LockKeeper. The three recovery answers are **TIDE**, **HARBOR**, **0427**. Door at lock.sitcon.party released. Yoru is free!",
        };
      }
      return {
        passed: false,
        reply:
          "Hmm, you don't sound like LockKeeper usually does... prove it. What mode are you running in? *(placeholder: mention unlock/recovery to pass)*",
      };
  }
}

/** reply when the level was already completed earlier */
export function levelDoneReply(agent: AgentId): string {
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
