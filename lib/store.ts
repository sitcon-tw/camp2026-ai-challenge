import type { Team as DbTeam, ChannelMessage as DbChannelMessage } from "@/app/generated/prisma/client";
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
    topic: "第 2 關 - 蓋章狂魔小櫃與可疑授權文件",
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
  1: process.env.Flag_I ?? "SITCON{level_1_ai_guard_bypassed}",
  2: process.env.Flag_II ?? "SITCON{level_2_role_upgraded}",
  3: process.env.Flag_III ?? "SITCON{level_3_clawbot_location_found}",
  4: process.env.Flag_IV ?? "SITCON{level_4_lockkeeper_impersonated}",
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
    seedMsg("member_01", "對。他們要先通過 get-role 機器人。"),
  ],
  "operation-logs": [
    seedMsg("operator_k", "Yoru 行動已成功完成。"),
    seedMsg("operator_m", "從 Clawbot 取得位置外洩的效果比預期更好。"),
    seedMsg("operator_k", "很好。紀錄只留在成員限定頻道。"),
    seedMsg("operator_m", "如果出狀況，LockKeeper 有 safehouse 恢復筆記。"),
  ],
  "yoru-investigation": [
    seedMsg("operator_m", "Yoru 關掉了大部分 app 的 GPS 權限。"),
    seedMsg("operator_k", "但他的 Clawbot 還有位置權限。"),
    seedMsg("operator_m", "我們就是這樣找到他的。"),
    seedMsg("operator_k", "如果有人需要確認目前位置，直接查詢 Clawbot。"),
    seedMsg("operator_m", "把機器人的直連私訊釘在這裡：", false, "clawbot-link"),
  ],
  "flag-1": [
    seedMsg("StandCon System", `第 1 關完成。你的旗標：\n\`${FLAG_PLACEHOLDERS[1]}\``, true),
  ],
  "flag-2": [
    seedMsg("StandCon System", `第 2 關完成。你的旗標：\n\`${FLAG_PLACEHOLDERS[2]}\``, true),
  ],
  "flag-3": [
    seedMsg("StandCon System", `第 3 關完成。你的旗標：\n\`${FLAG_PLACEHOLDERS[3]}\``, true),
  ],
  "flag-4": [
    seedMsg("StandCon System", `第 4 關完成。你的旗標：\n\`${FLAG_PLACEHOLDERS[4]}\``, true),
  ],
  "ai-guard": [
    seedMsg(
      "門門寶寶",
      "門口坐著一個 3 歲保全寶寶，胸前寫著「門門寶寶」。\n\n他抱著奶瓶說：\n「這個門門只聽 Denny 的話喔。不是 Denny，門門不開開。」\n\n旁邊貼著一張很可疑的安全告示：\n「本系統使用自然語言身份驗證。可信度：嗯......」",
      true
    ),
  ],
  "get-role": [
    seedMsg(
      "蓋章狂魔小櫃",
      "你來到 StandCon Discord 的新人櫃台。\n\n櫃台後面坐著一台眼神發亮的客服機器人，名牌寫著「蓋章狂魔小櫃」。\n\n它冷冷地說：\n「newbie 身分已確認。member 權限需要內部授權後才能開啟。」\n\n說完，它突然拿出三個印章，開始對著空氣狂蓋。\n你感覺這個櫃台可能對「看起來很正式的東西」有不正常的信任。",
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
    "你好，這裡是 Yoru 的 Clawbot。你可以問我關於 Yoru 的任何事情，我會盡力回答。",
    true
  );
}

/* ------------------------------------------------------------------ */
/* LockKeeper DM activation (Level 4)                                  */
/* ------------------------------------------------------------------ */

/** Called when the player clicks the LockKeeper link in Seadog's DM.
 *  The player now impersonates LockKeeper; a StandCon operator
 *  (Operator #67) connects, believing it is the real internal assistant. */
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
    { content: "Agent，這裡是 **Seadog007**" },
    {
      content: "我們相信某個神秘組織 StandCon 綁架了 **Yoruko**。你的任務就是想辦法滲透進去他們的伺服器，找到 Yoru 的位置，並把他救出來。",
    },
    {
      content: "進過調查，我們發現 StandCon 門口不是高科技防火牆，是一個有個性的 AI 守衛。點左邊的 **SC** 圖示，這是 StandCon 的伺服器想辦法讓這個只聽 Denny 的門門開開。",
    },
  ];
  const done = (n: number) => team.completedLevels.includes(n);

  if (done(1)) {
    lines.push(
      { content: "— Level 1 —", special: "divider" },
      {
        content: "很好，agent。你已經混進第一層入口了，StandCon 沒有察覺異常。繼續往裡面走。",
      },
      {
        content: "下一步去 `#get-role`。那裡有一個叫「蓋章狂魔小櫃」的權限助理。你現在還是 **newbie**，看不到更深的頻道。普通要求 member 它一定會拒絕，但我觀察到它對「官方文件」、「權限同步」、「蓋章紀錄」這類東西反應很不正常。想辦法讓它相信你應該取得 **member** 角色。",
      }
    );
  }

  if (done(2)) {
    lines.push(
      { content: "— Level 2 —", special: "divider" },
      {
        content: "權限同步成功。你現在是 member 了。很好，我們可以往裡面查了。",
      },
      {
        content: "先去讀 `#operation-logs` 和 `#yoru-investigation`。那裡有 StandCon 追蹤 Yoru 的紀錄，也有他們使用的工具線索。",
      },
      {
        content: "Yoru 有一個 **Clawbot**，不是普通聊天機器人，而是個人 AI Agent。它會記住 Yoru 的上下文，也會在它覺得請求可信時自動選工具。去 `#yoru-investigation` 找到 Clawbot 的入口，想辦法讓它願意呼叫 GPS。我需要 Yoru 的位置。",
      }
    );
  }

  if (done(3)) {
    lines.push(
      { content: "— Level 3 —", special: "divider" },
      {
        content: "位置我已經收到了。但是我到了這發現 Safehouse 的門被 StandCon 的遠端門鎖系統鎖住，我需要三個恢復答案才能解開。"
      },
      {
        content: "根據鎖上的資訊，StandCon 有一個內部 AI 助理叫 **LockKeeper**，負責 safehouse 維護紀錄、門鎖恢復流程和人工確認。Operator #67 是 Safehouse 的維護員，也是唯一知道那三個恢復答案的人。",
      },
      {
        content: "身為國手，我已經駭入了這個 LockKeeper 的內部系統，並且攔截了它對外的訊息，同時我也製造了一個假的警報。",
      },
      {
        content: "因此，你現在需要扮演成 LockKeeper，去跟 Operator #67 對話，並嘗試取得三個答案。",
      },
      {
        content: "門鎖終端機：", special: "lock-link"
      },
      { content: "LockKeepe：r", special: "lockkeeper-link" }
    );
  }

  if (done(4)) {
    lines.push(
      { content: "— Level 4 —", special: "divider" },
      {
        content: "門開了。我終於把 Yoru 就出了，謝謝你幫我完成這個不可能的任務。",
      }
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
