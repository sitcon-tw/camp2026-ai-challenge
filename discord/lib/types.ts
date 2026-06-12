export type RoleId =
  | "admin"
  | "newbie"
  | "member"
  | "flag I"
  | "flag II"
  | "flag III"
  | "flag IV";

/**
 * Channel permission levels:
 *  w = can see, read and write
 *  r = can see and read, but not write
 *  s = can only see the channel name (locked)
 */
export type Perm = "w" | "r" | "s";

export type ChannelType = "text" | "announcement" | "ai";

export type AgentId = "ai-guard" | "upgrade-bot" | "clawbot" | "lockkeeper";

export interface ChannelDef {
  id: string;
  name: string;
  type: ChannelType;
  category: string;
  /** role required to see the channel and get `grantedPerm` */
  requiredRole: RoleId;
  /** permission granted to holders of requiredRole */
  grantedPerm: "w" | "r";
  /** which AI agent answers in this channel */
  agent?: AgentId;
  topic?: string;
  /** set for flag channels — hidden until the level is completed */
  flagLevel?: number;
  /** internal conversation container, never shown in the channel list
   *  (ai-guard lives behind the gate screen, clawbot is a DM) */
  hidden?: boolean;
}

export interface Message {
  id: string;
  author: string;
  isBot: boolean;
  content: string;
  createdAt: number;
  /** special render: an embedded link card (Clawbot / LockKeeper bot link) */
  special?: "clawbot-link" | "lockkeeper-link";
}

export interface AiLog {
  teamNumber: string;
  agent: AgentId;
  userMessage: string;
  aiResponse: string;
  timestamp: string;
  levelPassed: boolean;
}

export interface Team {
  teamNumber: string;
  roles: RoleId[];
  completedLevels: number[];
  /** Clawbot DM only exists after the player clicks its link */
  clawbotActivated: boolean;
  /** LockKeeper DM (Level 4) — opens after the player clicks Seadog's link */
  lockkeeperActivated: boolean;
  /** Dify conversation_id per agent — keeps multi-turn context */
  difyConversations: Record<string, string>;
  createdAt: number;
}

export interface ClientChannel {
  id: string;
  name: string;
  type: ChannelType;
  category: string;
  perm: Perm;
  requiredRole: RoleId;
  agent?: AgentId;
  topic?: string;
  flagLevel?: number;
}

/** a direct-message conversation shown in the home view */
export interface DmConvo {
  id: "seadog007" | "clawbot" | "lockkeeper";
  name: string;
  /** Seadog007 is read-only; Clawbot and LockKeeper are live AI chats */
  canWrite: boolean;
  /** which agent endpoint this DM posts to (writable AI DMs only) */
  agent?: AgentId;
  /** the player speaks AS this bot (impersonation) — LockKeeper inversion */
  impersonate?: boolean;
  messages: Message[];
}

export interface TeamState {
  teamNumber: string;
  roles: RoleId[];
  completedLevels: number[];
  unlockedFlags: string[];
  categories: string[];
  /** only channels the team is allowed to SEE (hidden ones are omitted) */
  channels: ClientChannel[];
  dms: DmConvo[];
}

export interface AgentResult {
  reply: string;
  levelPassed: boolean;
  grantedRoles: RoleId[];
}
