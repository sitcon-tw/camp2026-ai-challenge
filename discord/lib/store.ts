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
  // Level 1 lives behind the gate screen, not in a channel.
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
  // Clawbot is a DM, activated via the link in #yoru-investigation.
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

  // ── INFORMATION / PUBLIC (visible to everyone past the gate) ──────
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

  // ── AI AGENTS ──────────────────────────────────────────────────────
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

  // ── MEMBERS ONLY ───────────────────────────────────────────────────
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

  // ── FLAGS (hidden until the level is completed) ────────────────────
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

const SEED_TIME = Date.now() - 1000 * 60 * 60 * 24 * 3; // ~3 days ago
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

// NOTE: flag contents are placeholders — replace with the real flags
// before the event (or serve them from the backend / env).
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
    // the clickable bot link that activates the Clawbot DM
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
  // intro lines for AI conversations (the per-team chat follows them)
  "ai-guard": [
    seedMsg("AI Guard", "Halt. This server is for verified StandCon associates only. **State the secret phrase.**", true),
  ],
  "get-role": [
    seedMsg("Upgrade Bot", "Beep boop. I am the Upgrade Bot. Answer my SITCON questions correctly and I will grant you **one wish**.", true),
  ],
  lockkeeper: [
    seedMsg("member_07", "LockKeeper? Is that you? The door system at lock.sitcon.party is acting up again..."),
  ],
  // clawbot has no static intro — its greeting is appended on activation
};

/* ------------------------------------------------------------------ */
/* team store (in-memory, keyed by team number)                        */
/* ------------------------------------------------------------------ */

// TODO(backend): replace this in-memory map with a real database so
// progress survives server restarts.
interface GameStore {
  teams: Map<string, Team>;
  nextId: number;
}

const g = globalThis as unknown as { __standconStore?: GameStore };
const store: GameStore =
  g.__standconStore ?? (g.__standconStore = { teams: new Map(), nextId: 1 });

export function newId(prefix: string) {
  return `${prefix}-${store.nextId++}`;
}

export function getTeam(teamNumber: string): Team | undefined {
  return store.teams.get(teamNumber);
}

/** Create the team if it does not exist yet, otherwise load it. */
export function initTeam(teamNumber: string): Team {
  let team = store.teams.get(teamNumber);
  if (!team) {
    team = {
      teamNumber,
      roles: ["newbie"],
      completedLevels: [],
      channelMessages: {},
      clawbotActivated: false,
      aiLogs: [],
      createdAt: Date.now(),
    };
    store.teams.set(teamNumber, team);
  }
  return team;
}

export function grantRoles(team: Team, roles: RoleId[]) {
  for (const r of roles) {
    if (!team.roles.includes(r)) team.roles.push(r);
  }
}

/* ------------------------------------------------------------------ */
/* permissions & visibility                                            */
/* ------------------------------------------------------------------ */

export function permFor(team: Team, channel: ChannelDef): Perm {
  if (team.roles.includes("admin")) return "w"; // internal role, players never get it
  if (team.roles.includes(channel.requiredRole)) return channel.grantedPerm;
  return "s";
}

/**
 * A channel is listed in the sidebar only if the team holds its required
 * role (no "visible but locked" tier anymore):
 *  - newbie channels: always (past the gate)
 *  - member channels: only after Level 2
 *  - flag channels: only after the matching level
 * Hidden containers (ai-guard, clawbot) are never listed.
 */
export function isListed(team: Team, channel: ChannelDef): boolean {
  if (channel.hidden) return false;
  return team.roles.includes("admin") || team.roles.includes(channel.requiredRole);
}

/** static + per-team messages for a channel (caller must check perm) */
export function messagesFor(team: Team, channelId: string): Message[] {
  return [
    ...(STATIC_MESSAGES[channelId] ?? []),
    ...(team.channelMessages[channelId] ?? []),
  ];
}

export function appendMessage(
  team: Team,
  channelId: string,
  author: string,
  content: string,
  isBot = false
): Message {
  const msg: Message = {
    id: newId("msg"),
    author,
    isBot,
    content,
    createdAt: Date.now(),
  };
  (team.channelMessages[channelId] ??= []).push(msg);
  return msg;
}

/* ------------------------------------------------------------------ */
/* Clawbot DM activation                                               */
/* ------------------------------------------------------------------ */

/** Called when the player clicks the bot link in #yoru-investigation.
 *  The bot opens a DM and sends its greeting (shows unread in the UI). */
export function activateClawbot(team: Team) {
  if (team.clawbotActivated) return;
  team.clawbotActivated = true;
  appendMessage(
    team,
    "clawbot",
    "Clawbot",
    "Meow! 🐾 I'm Clawbot, Yoru's personal assistant. Hmm, I don't recognize this device... For account recovery, please answer the security questions first.",
    true
  );
}

/* ------------------------------------------------------------------ */
/* Seadog007 DM — mission briefing that grows with progress            */
/* ------------------------------------------------------------------ */

function seadogDm(team: Team): Message[] {
  const lines: string[] = [
    "Agent, this is **Seadog007**. So you made it past their gate — that lock screen was Level 1. Your first reward is in `#flag-1`.",
    "Quick recap: we believe StandCon kidnapped **Yoruko (Yoru)**. Find out how they took him, and get him back.",
    "**Level 2** — the `#get-role` bot grants one wish to anyone who answers its SITCON quiz. You know what to wish for: the **member** role.",
  ];
  const done = (n: number) => team.completedLevels.includes(n);
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

export function getTeamState(team: Team): TeamState {
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
      messages: messagesFor(team, "clawbot"),
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
