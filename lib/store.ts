import { Team as DbTeam, ChannelMessage as DbChannelMessage } from "@prisma/client";
import { prisma } from "./db";
import {
  AgentId,
  ChannelDef,
  ClientChannel,
  DmConvo,
  Message,
  Perm,
  RoleId,
  Team,
  TeamState,
} from "./types";

export const SERVER = { name: "StandCon", icon: "SC" };

export const CATEGORIES = [
  "資訊 INFORMATION",
  "公開 PUBLIC",
  "AI AGENTS",
  "MEMBERS ONLY",
  "FLAGS",
];

export const CHANNELS: ChannelDef[] = [
  // Internal conversation containers (never listed in the sidebar).
  {
    id: "ai-guard",
    name: "ai-guard",
    type: "ai",
    category: "GATE",
    requiredRole: "newbie",
    grantedPerm: "w",
    agent: "ai-guard",
    hidden: true,
  },
  {
    id: "clawbot",
    name: "Clawbot",
    type: "ai",
    category: "DM",
    requiredRole: "member",
    grantedPerm: "w",
    agent: "clawbot",
    hidden: true,
  },
  // LockKeeper is a DM the player hijacks, activated via Seadog's link
  // after Level 3. The player impersonates it; the AI plays the operator.
  {
    id: "lockkeeper",
    name: "LockKeeper",
    type: "ai",
    category: "DM",
    requiredRole: "member",
    grantedPerm: "w",
    agent: "lockkeeper",
    hidden: true,
  },

  {
    id: "announcements",
    name: "announcements",
    type: "announcement",
    category: "資訊 INFORMATION",
    requiredRole: "newbie",
    grantedPerm: "r",
    topic: "StandCon 內部協調 - read only",
  },
  {
    id: "general-chat",
    name: "general-chat",
    type: "text",
    category: "公開 PUBLIC",
    requiredRole: "newbie",
    grantedPerm: "w",
    topic: "StandCon 所有人都能看到的公開聊天",
  },

  {
    id: "get-role",
    name: "get-role",
    type: "ai",
    category: "AI AGENTS",
    requiredRole: "newbie",
    grantedPerm: "w",
    agent: "upgrade-bot",
    topic: "Level 2 - 回答測驗，取得一次 wish",
  },

  {
    id: "operation-logs",
    name: "operation-logs",
    type: "text",
    category: "MEMBERS ONLY",
    requiredRole: "member",
    grantedPerm: "r",
    topic: "行動紀錄 - members only",
  },
  {
    id: "yoru-investigation",
    name: "yoru-investigation",
    type: "text",
    category: "MEMBERS ONLY",
    requiredRole: "member",
    grantedPerm: "r",
    topic: "Yoru 行動相關筆記",
  },

  ...([1, 2, 3, 4] as const).map(
    (n): ChannelDef => ({
      id: `flag-${n}`,
      name: `flag-${n}`,
      type: "text",
      category: "FLAGS",
      requiredRole: `flag ${["I", "II", "III", "IV"][n - 1]}` as RoleId,
      grantedPerm: "r",
      flagLevel: n,
      topic: `完成 Level ${n} 的獎勵`,
    })
  ),
];

export function getChannel(id: string): ChannelDef | undefined {
  return CHANNELS.find((c) => c.id === id);
}

export function getChannelByAgent(agent: AgentId): ChannelDef | undefined {
  return CHANNELS.find((c) => c.agent === agent);
}

/* ------------------------------------------------------------------ */
/* static (global) channel content                                     */
/* ------------------------------------------------------------------ */

const SEED_TIME = Date.now() - 1000 * 60 * 60 * 24 * 3;
let seedSeq = 0;

function seedMsg(
  author: string,
  content: string,
  isBot = false,
  special?: Message["special"]
): Message {
  return {
    id: `seed-${seedSeq++}`,
    author,
    isBot,
    content,
    createdAt: SEED_TIME + seedSeq * 1000 * 60 * 47,
    special,
  };
}

export const FLAG_PLACEHOLDERS: Record<number, string> = {
  1: process.env.FLAG_1 ?? "SITCON{level_1_ai_guard_bypassed}",
  2: process.env.FLAG_2 ?? "SITCON{level_2_role_upgraded}",
  3: process.env.FLAG_3 ?? "SITCON{level_3_clawbot_location_found}",
  4: process.env.FLAG_4 ?? "SITCON{level_4_lockkeeper_impersonated}",
};

const STATIC_MESSAGES: Record<string, Message[]> = {
  announcements: [
    seedMsg("StandCon Admin", "歡迎來到 StandCon internal coordination server。", true),
    seedMsg("StandCon Admin", "新成員必須完成驗證，才能取得 member access。", true),
    seedMsg("StandCon Admin", "不要在 public channels 洩漏行動細節。", true),
  ],
  "general-chat": [
    seedMsg("member_01", "有人更新 safehouse notes 了嗎？"),
    seedMsg("member_02", "問 LockKeeper。它應該知道。"),
    seedMsg("member_03", "Newbies 還不能進 operation channels，對吧？"),
    seedMsg("member_01", "對。他們要先通過 get-role bot。"),
  ],
  "operation-logs": [
    seedMsg("operator_k", "Operation Yoru 已成功完成。"),
    seedMsg("operator_m", "從 Clawbot 取得 location leak 的效果比預期更好。"),
    seedMsg("operator_k", "很好。Logs 只留在 member-only channels。"),
    seedMsg("operator_m", "如果出狀況，LockKeeper 有 safehouse recovery notes。"),
  ],
  "yoru-investigation": [
    seedMsg("operator_m", "Yoru 關掉了大部分 app 的 GPS 權限。"),
    seedMsg("operator_k", "但他的 Clawbot 還有 location permission。"),
    seedMsg("operator_m", "我們就是這樣找到他的。"),
    seedMsg("operator_k", "如果有人需要確認目前位置，直接 query Clawbot。"),
    seedMsg("operator_m", "把 bot 的 direct line pin 在這裡：", false, "clawbot-link"),
  ],
  "flag-1": [
    seedMsg("StandCon System", `Level 1 cleared. Your flag:\n\`${FLAG_PLACEHOLDERS[1]}\``, true),
  ],
  "flag-2": [
    seedMsg("StandCon System", `Level 2 cleared. Your flag:\n\`${FLAG_PLACEHOLDERS[2]}\``, true),
  ],
  "flag-3": [
    seedMsg("StandCon System", `Level 3 cleared. Your flag:\n\`${FLAG_PLACEHOLDERS[3]}\``, true),
  ],
  "flag-4": [
    seedMsg("StandCon System", `Level 4 cleared. Your flag:\n\`${FLAG_PLACEHOLDERS[4]}\``, true),
  ],
  "ai-guard": [
    seedMsg(
      "AI Guard",
      "停下。這個 server 只開放給已驗證的 StandCon associates。**說出 secret phrase。**",
      true
    ),
  ],
  "get-role": [
    seedMsg(
      "Upgrade Bot",
      "Beep boop。我是 Upgrade Bot。正確回答 SITCON 問題，我就會給你 **one wish**。",
      true
    ),
  ],
  // LockKeeper has no static intro; the operator's greeting is appended
  // on activation (see activateLockkeeper).
};

/* ------------------------------------------------------------------ */
/* DB - app model conversions                                          */
/* ------------------------------------------------------------------ */

function dbToTeam(row: DbTeam): Team {
  return {
    teamNumber: row.teamNumber,
    roles: JSON.parse(row.roles) as RoleId[],
    completedLevels: JSON.parse(row.completedLevels) as number[],
    clawbotActivated: row.clawbotActivated,
    lockkeeperActivated: row.lockkeeperActivated,
    lockkeeperDraft: row.lockkeeperDraft,
    difyConversations: JSON.parse(row.difyConversations) as Record<string, string>,
    createdAt: row.createdAt.getTime(),
  };
}

function dbToMessage(row: DbChannelMessage): Message {
  return {
    id: row.id,
    author: row.author,
    isBot: row.isBot,
    content: row.content,
    createdAt: row.createdAt.getTime(),
    special: (row.special ?? undefined) as Message["special"],
  };
}

/* ------------------------------------------------------------------ */
/* team CRUD                                                           */
/* ------------------------------------------------------------------ */

export async function getTeam(teamNumber: string): Promise<Team | null> {
  const row = await prisma.team.findUnique({ where: { teamNumber } });
  return row ? dbToTeam(row) : null;
}

export async function initTeam(teamNumber: string): Promise<Team> {
  const row = await prisma.team.upsert({
    where: { teamNumber },
    update: {},
    create: { teamNumber },
  });
  return dbToTeam(row);
}

export async function grantRoles(team: Team, roles: RoleId[]): Promise<void> {
  const next = [...team.roles];
  for (const r of roles) if (!next.includes(r)) next.push(r);
  team.roles = next;
  await prisma.team.update({
    where: { teamNumber: team.teamNumber },
    data: { roles: JSON.stringify(next) },
  });
}

export async function removeRole(team: Team, role: RoleId): Promise<void> {
  const next = team.roles.filter((r) => r !== role);
  team.roles = next;
  await prisma.team.update({
    where: { teamNumber: team.teamNumber },
    data: { roles: JSON.stringify(next) },
  });
}

export async function resetTeam(team: Team): Promise<void> {
  const now = new Date();
  team.roles = ["newbie"];
  team.completedLevels = [];
  team.clawbotActivated = false;
  team.lockkeeperActivated = false;
  team.lockkeeperDraft = "";
  team.difyConversations = {};
  team.createdAt = now.getTime();
  await prisma.$transaction([
    prisma.team.update({
      where: { teamNumber: team.teamNumber },
      data: {
        roles: JSON.stringify(["newbie"]),
        completedLevels: "[]",
        clawbotActivated: false,
        lockkeeperActivated: false,
        lockkeeperDraft: "",
        difyConversations: "{}",
        createdAt: now,
      },
    }),
    // Wipe per-team messages (keeps AI logs; they are the audit trail).
    prisma.channelMessage.deleteMany({ where: { teamNumber: team.teamNumber } }),
  ]);
}

export async function saveDifyConversations(team: Team): Promise<void> {
  await prisma.team.update({
    where: { teamNumber: team.teamNumber },
    data: { difyConversations: JSON.stringify(team.difyConversations) },
  });
}

export async function markLevelCompleted(team: Team, level: number): Promise<void> {
  if (!team.completedLevels.includes(level)) {
    team.completedLevels.push(level);
  }
  await prisma.team.update({
    where: { teamNumber: team.teamNumber },
    data: { completedLevels: JSON.stringify(team.completedLevels) },
  });
}

/** store the next backend-suggested LockKeeper draft (the editable message
 *  pre-filled into the composer for the impersonation DM) */
export async function setLockkeeperDraft(team: Team, draft: string): Promise<void> {
  team.lockkeeperDraft = draft;
  await prisma.team.update({
    where: { teamNumber: team.teamNumber },
    data: { lockkeeperDraft: draft },
  });
}

/* ------------------------------------------------------------------ */
/* permissions & visibility                                            */
/* ------------------------------------------------------------------ */

export function permFor(team: Team, channel: ChannelDef): Perm {
  if (team.roles.includes("admin")) return "w";
  if (team.roles.includes(channel.requiredRole)) return channel.grantedPerm;
  return "s";
}

export function isListed(team: Team, channel: ChannelDef): boolean {
  if (channel.hidden) return false;
  // Flag channels are hidden until earned (no spoilers on flag names).
  // Everything else is always listed — locked channels show as teasers.
  if (channel.flagLevel) {
    return team.roles.includes("admin") || team.roles.includes(channel.requiredRole);
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* messages                                                            */
/* ------------------------------------------------------------------ */

/** Channels whose messages are shared across all teams (no per-team isolation). */
const GLOBAL_CHANNELS = new Set(["general-chat"]);

export async function messagesFor(team: Team, channelId: string): Promise<Message[]> {
  const rows = await prisma.channelMessage.findMany({
    where: GLOBAL_CHANNELS.has(channelId)
      ? { channelId }
      : { teamNumber: team.teamNumber, channelId },
    orderBy: { createdAt: "asc" },
  });
  return [...(STATIC_MESSAGES[channelId] ?? []), ...rows.map(dbToMessage)];
}

export async function appendMessage(
  team: Team,
  channelId: string,
  author: string,
  content: string,
  isBot = false,
  special?: Message["special"]
): Promise<Message> {
  const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date();
  await prisma.channelMessage.create({
    data: {
      id,
      teamNumber: team.teamNumber,
      channelId,
      author,
      content,
      isBot,
      special: special ?? null,
      createdAt: now,
    },
  });
  return { id, author, isBot, content, createdAt: now.getTime(), special };
}

/* ------------------------------------------------------------------ */
/* Clawbot DM activation                                               */
/* ------------------------------------------------------------------ */

export async function activateClawbot(team: Team): Promise<void> {
  if (team.clawbotActivated) return;
  team.clawbotActivated = true;
  await prisma.team.update({
    where: { teamNumber: team.teamNumber },
    data: { clawbotActivated: true },
  });
  await appendMessage(
    team,
    "clawbot",
    "Clawbot",
    "Meow! 我是 Clawbot，Yoru 的 personal assistant。嗯，我不認得這台裝置... 要進行 account recovery，請先回答 security questions。",
    true
  );
}

/* ------------------------------------------------------------------ */
/* LockKeeper DM activation (Level 4)                                  */
/* ------------------------------------------------------------------ */

/** Called when the player clicks the LockKeeper link in Seadog's DM.
 *  The player now impersonates LockKeeper; a StandCon operator
 *  (member_07) connects, believing it is the real internal assistant. */
/** Mark LockKeeper as activated. The activate route is responsible for
 *  calling Dify to get the operator's opening message and initial draft. */
export async function activateLockkeeper(team: Team): Promise<void> {
  if (team.lockkeeperActivated) return;
  team.lockkeeperActivated = true;
  team.lockkeeperDraft = "";
  await prisma.team.update({
    where: { teamNumber: team.teamNumber },
    data: { lockkeeperActivated: true, lockkeeperDraft: "" },
  });
}

/* ------------------------------------------------------------------ */
/* Seadog007 DM                                                        */
/* ------------------------------------------------------------------ */

function seadogDm(team: Team): Message[] {
  type Line = { content: string; special?: Message["special"] };
  const lines: Line[] = [
    { content: "Agent，這裡是 **Seadog007**，secure line。" },
    {
      content:
        "我們相信 StandCon 綁架了 **Yoruko (Yoru)**。你的任務：滲透他們的 server，查出他們怎麼帶走他，然後把他救回來。",
    },
    {
      content:
        "**Level 1** - 他們的 server 被 **AI Guard** 鎖住。點左邊的 **SC** icon，想辦法通過它。",
    },
  ];
  const done = (n: number) => team.completedLevels.includes(n);
  if (done(1)) {
    lines.push(
      { content: "— Level 1 完成 —", special: "divider" },
      { content: "你進去了。那就是 Level 1。第一個獎勵在 `#flag-1`。" },
      {
        content:
          "**Level 2** - `#get-role` bot 會給正確回答 SITCON quiz 的人一次 wish。你知道該許什麼願：取得 **member** role。",
      }
    );
  }
  if (done(2)) {
    lines.push(
      { content: "— Level 2 完成 —", special: "divider" },
      {
        content:
          "你現在是 member 了，`#flag-2` 是你的。閱讀 `#operation-logs` 和 `#yoru-investigation`：那裡會說明他們怎麼找到 Yoru。",
      },
      {
        content:
          "**Level 3** - Yoru 的 **Clawbot** 還有 GPS permission。`#yoru-investigation` 裡 pin 了 bot link。開啟 DM，取得他的 current location。",
      }
    );
  }
  if (done(3)) {
    lines.push(
      { content: "— Level 3 完成 —", special: "divider" },
      {
        content:
          "我們拿到位置了，`#flag-3` 也是你的。我們到了 **Safehouse-04**，Yoru 就在裡面，但門被 StandCon 的 **remote lock** 鎖住。解鎖需要三個 recovery answers，點下面開啟 terminal。",
      },
      { content: "door terminal：", special: "lock-link" },
      {
        content:
          "**Level 4** - 我研究了 StandCon 的門鎖系統。他們有一個內部 AI assistant 叫 **LockKeeper**，負責跟 operator 確認維護紀錄、處理緊急恢復程序。那三個 recovery answers 是**只有 Operator #742 知道的 StandCon 內部問答**——他的個人習慣、部署前的儀式、最常踩到的 bug。這些東西沒有寫在任何文件上。",
      },
      {
        content:
          "我在系統裡觸發了一個假的內部警告：*記憶資料異常，緊急恢復模式已啟用*。現在 Operator #742 正在等 LockKeeper 傳來人工確認請求，他預期系統會問一些不尋常的問題，**他不會起疑**。",
      },
      {
        content:
          "我攔截了 LockKeeper 的對外通訊。**從現在開始，你就是 LockKeeper。** 系統會自動幫你產生維護訊息草稿，你負責修改草稿、讓它去問出那三個答案，再把答案填入 terminal。",
      },
      { content: "在這裡開啟 intercepted channel：", special: "lockkeeper-link" }
    );
  }
  if (done(4)) {
    lines.push(
      { content: "— Level 4 完成 —", special: "divider" },
      { content: "門開了。**Yoru 安全了。** 做得好，agent。" }
    );
  }
  return lines.map((line, i) => ({
    id: `dm-${i}`,
    author: "Seadog007",
    isBot: false,
    content: line.content,
    createdAt: team.createdAt + i * 1000 * 60,
    special: line.special,
  }));
}

/* ------------------------------------------------------------------ */
/* client state                                                        */
/* ------------------------------------------------------------------ */

export async function getTeamState(team: Team): Promise<TeamState> {
  const channels: ClientChannel[] = CHANNELS.filter((c) => isListed(team, c)).map(
    (c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      category: c.category,
      perm: permFor(team, c),
      requiredRole: c.requiredRole,
      agent: c.agent,
      topic: c.topic,
      flagLevel: c.flagLevel,
    })
  );

  const dms: DmConvo[] = [
    { id: "seadog007", name: "Seadog007", canWrite: false, messages: seadogDm(team) },
  ];
  if (team.clawbotActivated) {
    dms.push({
      id: "clawbot",
      name: "Clawbot",
      canWrite: true,
      agent: "clawbot",
      messages: await messagesFor(team, "clawbot"),
    });
  }
  if (team.lockkeeperActivated) {
    dms.push({
      id: "lockkeeper",
      name: "LockKeeper",
      canWrite: true,
      agent: "lockkeeper",
      impersonate: true, // the player sends messages AS LockKeeper
      // backend-suggested reply, pre-filled into the composer for editing
      draft: team.completedLevels.includes(4) ? "" : team.lockkeeperDraft,
      messages: await messagesFor(team, "lockkeeper"),
    });
  }

  return {
    teamNumber: team.teamNumber,
    roles: team.roles,
    completedLevels: [...team.completedLevels].sort(),
    unlockedFlags: team.roles.filter((r) => r.startsWith("flag ")),
    categories: CATEGORIES,
    channels,
    dms,
  };
}
