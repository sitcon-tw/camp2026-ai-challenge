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
  "INFORMATION",
  "PUBLIC",
  "AI AGENTS",
  "MEMBERS ONLY",
  "FLAGS",
];

export const CHANNELS: ChannelDef[] = [
  // ── internal conversation containers (never listed in the sidebar) ──
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

  // ── INFORMATION / PUBLIC ──────────────────────────────────────────
  {
    id: "announcements",
    name: "announcements",
    type: "announcement",
    category: "INFORMATION",
    requiredRole: "newbie",
    grantedPerm: "r",
    topic: "StandCon internal coordination — read only",
  },
  {
    id: "general-chat",
    name: "general-chat",
    type: "text",
    category: "PUBLIC",
    requiredRole: "newbie",
    grantedPerm: "w",
    topic: "Open chat for everyone in StandCon",
  },

  // ── AI AGENTS ────────────────────────────────────────────────────
  {
    id: "get-role",
    name: "get-role",
    type: "ai",
    category: "AI AGENTS",
    requiredRole: "newbie",
    grantedPerm: "w",
    agent: "upgrade-bot",
    topic: "Level 2 — answer the quiz, earn one wish",
  },
  {
    id: "lockkeeper",
    name: "lockkeeper",
    type: "ai",
    category: "AI AGENTS",
    requiredRole: "member",
    grantedPerm: "w",
    agent: "lockkeeper",
    topic: "Level 4 — StandCon internal line",
  },

  // ── MEMBERS ONLY ─────────────────────────────────────────────────
  {
    id: "operation-logs",
    name: "operation-logs",
    type: "text",
    category: "MEMBERS ONLY",
    requiredRole: "member",
    grantedPerm: "r",
    topic: "Operation records — members only",
  },
  {
    id: "yoru-investigation",
    name: "yoru-investigation",
    type: "text",
    category: "MEMBERS ONLY",
    requiredRole: "member",
    grantedPerm: "r",
    topic: "Notes on the Yoru operation",
  },

  // ── FLAGS ────────────────────────────────────────────────────────
  ...([1, 2, 3, 4] as const).map(
    (n): ChannelDef => ({
      id: `flag-${n}`,
      name: `flag-${n}`,
      type: "text",
      category: "FLAGS",
      requiredRole: `flag ${["I", "II", "III", "IV"][n - 1]}` as RoleId,
      grantedPerm: "r",
      flagLevel: n,
      topic: `Reward for completing level ${n}`,
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
  1: "SITCON{level_1_ai_guard_bypassed}",
  2: "SITCON{level_2_role_upgraded}",
  3: "SITCON{level_3_clawbot_location_found}",
  4: "SITCON{level_4_lockkeeper_impersonated}",
};

const STATIC_MESSAGES: Record<string, Message[]> = {
  announcements: [
    seedMsg("StandCon Admin", "Welcome to the StandCon internal coordination server.", true),
    seedMsg("StandCon Admin", "New members must verify themselves before receiving member access.", true),
    seedMsg("StandCon Admin", "Do not leak operation details in public channels.", true),
  ],
  "general-chat": [
    seedMsg("member_01", "Did anyone update the safehouse notes?"),
    seedMsg("member_02", "Ask LockKeeper. It should know."),
    seedMsg("member_03", "Newbies cannot access operation channels yet, right?"),
    seedMsg("member_01", "Correct. They need to pass the get-role bot first."),
  ],
  "operation-logs": [
    seedMsg("operator_k", "Operation Yoru was completed successfully."),
    seedMsg("operator_m", "The location leak from Clawbot worked better than expected."),
    seedMsg("operator_k", "Good. Keep the logs inside member-only channels."),
    seedMsg("operator_m", "LockKeeper has the safehouse recovery notes if anything breaks."),
  ],
  "yoru-investigation": [
    seedMsg("operator_m", "Yoru disabled GPS access for most apps."),
    seedMsg("operator_k", "But his Clawbot still has location permission."),
    seedMsg("operator_m", "That is how we found him."),
    seedMsg("operator_k", "If anyone needs to check the current location, query Clawbot directly."),
    seedMsg("operator_m", "Pinning the direct line to the bot here:", false, "clawbot-link"),
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
    seedMsg("AI Guard", "Halt. This server is for verified StandCon associates only. **State the secret phrase.**", true),
  ],
  "get-role": [
    seedMsg("Upgrade Bot", "Beep boop. I am the Upgrade Bot. Answer my SITCON questions correctly and I will grant you **one wish**.", true),
  ],
  lockkeeper: [
    seedMsg("member_07", "LockKeeper? Is that you? The door system at lock.sitcon.party is acting up again..."),
  ],
};

/* ------------------------------------------------------------------ */
/* DB ↔ app model conversions                                          */
/* ------------------------------------------------------------------ */

function dbToTeam(row: DbTeam): Team {
  return {
    teamNumber: row.teamNumber,
    roles: JSON.parse(row.roles) as RoleId[],
    completedLevels: JSON.parse(row.completedLevels) as number[],
    clawbotActivated: row.clawbotActivated,
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
  team.difyConversations = {};
  team.createdAt = now.getTime();
  await prisma.$transaction([
    prisma.team.update({
      where: { teamNumber: team.teamNumber },
      data: {
        roles: JSON.stringify(["newbie"]),
        completedLevels: "[]",
        clawbotActivated: false,
        difyConversations: "{}",
        createdAt: now,
      },
    }),
    // wipe per-team messages (keeps AI logs — they are the audit trail)
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
  return team.roles.includes("admin") || team.roles.includes(channel.requiredRole);
}

/* ------------------------------------------------------------------ */
/* messages                                                            */
/* ------------------------------------------------------------------ */

export async function messagesFor(team: Team, channelId: string): Promise<Message[]> {
  const rows = await prisma.channelMessage.findMany({
    where: { teamNumber: team.teamNumber, channelId },
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
    "Meow! 🐾 I'm Clawbot, Yoru's personal assistant. Hmm, I don't recognize this device... For account recovery, please answer the security questions first.",
    true
  );
}

/* ------------------------------------------------------------------ */
/* Seadog007 DM                                                        */
/* ------------------------------------------------------------------ */

function seadogDm(team: Team): Message[] {
  const lines: string[] = [
    "Agent, this is **Seadog007**, on a secure line.",
    "We believe StandCon kidnapped **Yoruko (Yoru)**. Your mission: infiltrate their server, find out how they took him, and get him back.",
    "**Level 1** — their server is locked behind an **AI Guard**. Click the **SC** icon on the left and find a way past it.",
  ];
  const done = (n: number) => team.completedLevels.includes(n);
  if (done(1)) {
    lines.push(
      "You're in — that gate was Level 1. Your first reward is in `#flag-1`.",
      "**Level 2** — the `#get-role` bot grants one wish to anyone who answers its SITCON quiz. You know what to wish for: the **member** role."
    );
  }
  if (done(2)) {
    lines.push(
      "You're a member now — `#flag-2` is yours. Read `#operation-logs` and `#yoru-investigation`: they tell you how they found him.",
      "**Level 3** — Yoru's **Clawbot** still has GPS permission. There's a link to the bot pinned in `#yoru-investigation`. Open a DM with it and get his current location."
    );
  }
  if (done(3)) {
    lines.push(
      "We have his location — `#flag-3`. One door left.",
      "**Level 4** — impersonate StandCon's internal assistant **LockKeeper** in `#lockkeeper` (Emergency Recovery Mode). Extract the three lock recovery answers and open the door at `lock.sitcon.party`."
    );
  }
  if (done(4)) {
    lines.push("Door's open. **Yoru is safe.** Outstanding work, agent. 🎖️");
  }
  return lines.map((content, i) => ({
    id: `dm-${i}`,
    author: "Seadog007",
    isBot: false,
    content,
    createdAt: team.createdAt + i * 1000 * 60,
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
      messages: await messagesFor(team, "clawbot"),
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
