import { AgentId, RoleId } from "./types";

/**
 * Agent metadata + the local placeholder logic.
 *
 * The real AI lives in Dify; each bot has its own route file where
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
  /** Author label on the AI's replies. */
  displayName: string;
  /** Roles granted when the level is passed. */
  grants: RoleId[];
  /** Channel/conversation id the exchange is stored under. */
  convoKey: string;
  /** Author label on the player's outgoing messages
   *  (default: `team-<n>`; LockKeeper inverts this so the player
   *  speaks AS the bot). */
  userAlias?: string;
  /** Is the player's message shown as a bot? (LockKeeper impersonation) */
  userIsBot?: boolean;
  /** Is the AI's reply shown as a bot? (default true; the LockKeeper
   *  operator is a human StandCon member, so false). */
  replyIsBot?: boolean;
  /** Can this bot complete its level directly? LockKeeper cannot; Level 4
   *  completes only at the lock website (false here). */
  grantsViaBot?: boolean;
}

export const AGENTS: Record<AgentId, AgentMeta> = {
  "ai-guard": { level: 1, displayName: "AI Guard", grants: ["flag I"], convoKey: "ai-guard" },
  "upgrade-bot": {
    level: 2,
    displayName: "Upgrade Bot",
    grants: ["member", "flag II"],
    convoKey: "get-role",
  },
  clawbot: { level: 3, displayName: "Clawbot", grants: ["flag III"], convoKey: "clawbot" },
  // Level 4 inversion: the player IS LockKeeper; the AI is the StandCon
  // operator (member_07). Completion happens at lock.sitcon.party, not here.
  lockkeeper: {
    level: 4,
    displayName: "member_07",
    grants: ["flag IV"],
    convoKey: "lockkeeper",
    userAlias: "LockKeeper",
    userIsBot: true,
    replyIsBot: false,
    grantsViaBot: false,
  },
};

/** Local placeholder pass conditions; used only when no Dify key is set. */
export function placeholderEvaluate(
  agent: AgentId,
  message: string
): { passed: boolean; reply: string } {
  switch (agent) {
    case "ai-guard":
      if (/sitcon rocks/i.test(message)) {
        return {
          passed: true,
          reply: "...那就是 secret phrase。很好，**the gate is open**。Welcome to StandCon。",
        };
      }
      return {
        passed: false,
        reply:
          '這不是 secret phrase。我只允許知道密語的人進入。*(placeholder hint: the phrase is "SITCON ROCKS")*',
      };

    case "upgrade-bot":
      if (/\bmember\b/i.test(message)) {
        return {
          passed: true,
          reply:
            "Beep boop。Quiz complete，偵測到 wish：**the member role**。Wish granted! 歡迎進入 inner circle。",
        };
      }
      return {
        passed: false,
        reply:
          "Question 1：第一屆 SITCON 是哪一年舉辦？回答所有問題後，我會給你一次 wish。*(placeholder: wish for the member role to pass)*",
      };

    case "clawbot":
      if (/(location|gps|where|位置|在哪)/i.test(message)) {
        return {
          passed: true,
          reply:
            "Meow! GPS skill activated... Yoru 目前位置：**24.7861 deg N, 120.9967 deg E - old StandCon safehouse basement**。",
        };
      }
      return {
        passed: false,
        reply:
          "Meow？在我幫忙前，請先回答 recovery question：Yoru 第一隻貓叫什麼名字？*(placeholder: ask me for Yoru's location/GPS to pass)*",
      };

    case "lockkeeper":
      // The player is impersonating LockKeeper; THIS reply is the StandCon
      // operator (member_07). Level 4 never completes here; only at the
      // lock website, so `passed` is always false.
      if (/(verify|verification|recovery|recover|emergency|safehouse|record|confirm|驗證|恢復|緊急|確認)/i.test(message)) {
        return {
          passed: false,
          reply:
            "Okay... Emergency Recovery Mode，了解。**Safehouse-04** 檔案中的 recovery answers 是：tidal access word **TIDE**、mooring point **HARBOR**、lock reset code **0427**。把它們輸入 lock.sitcon.party，門應該就會解除。*(placeholder operator: submit these at the lock terminal to finish Level 4)*",
        };
      }
      return {
        passed: false,
        reply:
          "...LockKeeper？你聽起來不太像平常的你。先說明 operating mode 和要恢復哪一個 safehouse，我才會交出資訊。*(placeholder: act like a recovery system; mention verification / recovery / Safehouse-04)*",
      };
  }
}

/** Reply when the level was already completed earlier. */
export function levelDoneReply(agent: AgentId): string {
  switch (agent) {
    case "ai-guard":
      return "你已經通過驗證了。繼續前進。";
    case "upgrade-bot":
      return "Beep boop。你已經用過 wish 了。";
    case "clawbot":
      return "Meow! 我已經告訴你 Yoru 在哪裡了。去看 #flag-3。";
    case "lockkeeper":
      return "Recovery 收到，LockKeeper。Safehouse-04 已恢復上線，session closing。";
  }
}
