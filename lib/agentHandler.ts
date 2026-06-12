import { NextRequest, NextResponse } from "next/server";
import { AGENTS, levelDoneReply, placeholderEvaluate } from "./agents";
import {
  appendMessage,
  getChannelByAgent,
  getTeam,
  grantRoles,
  markLevelCompleted,
  permFor,
  saveDifyConversations,
} from "./store";
import { prisma } from "./db";
import { AgentId, AgentResult, RoleId } from "./types";

export interface AgentCallContext {
  teamNumber: string;
  message: string;
  conversationId: string;
}

export interface AgentCallResult {
  reply: string;
  passed: boolean;
  conversationId?: string;
}

export type AgentCaller = (ctx: AgentCallContext) => Promise<AgentCallResult>;

export async function handleAgentRequest(
  req: NextRequest,
  agentId: AgentId,
  callAI?: AgentCaller
) {
  const body = await req.json().catch(() => null);
  const teamNumber = String(body?.teamNumber ?? "");
  const message = String(body?.message ?? "").trim();

  const team = await getTeam(teamNumber);
  if (!team) return NextResponse.json({ error: "找不到隊伍。" }, { status: 404 });
  if (!message) return NextResponse.json({ error: "訊息不能是空的。" }, { status: 400 });

  const channel = getChannelByAgent(agentId);
  if (!channel || permFor(team, channel) !== "w") {
    return NextResponse.json(
      { error: "你沒有權限和這個 agent 對話。" },
      { status: 403 }
    );
  }
  if (agentId === "clawbot" && !team.clawbotActivated) {
    return NextResponse.json(
      { error: "這個隊伍尚未啟用 Clawbot。" },
      { status: 403 }
    );
  }
  if (agentId === "lockkeeper" && !team.lockkeeperActivated) {
    return NextResponse.json(
      { error: "LockKeeper channel 尚未被攔截。" },
      { status: 403 }
    );
  }

  const meta = AGENTS[agentId];
  const alreadyDone = team.completedLevels.includes(meta.level);

  // Record the player's message. LockKeeper inverts the identity so the
  // player's message is shown AS the bot they are impersonating.
  const userAuthor = meta.userAlias ?? `team-${team.teamNumber}`;
  await appendMessage(team, meta.convoKey, userAuthor, message, meta.userIsBot ?? false);

  let reply: string;
  let passed = false;

  if (alreadyDone) {
    reply = levelDoneReply(agentId);
  } else if (callAI) {
    try {
      team.difyConversations ??= {};
      const result = await callAI({
        teamNumber,
        message,
        conversationId: team.difyConversations[agentId] ?? "",
      });
      reply = result.reply;
      passed = result.passed;
      if (result.conversationId) {
        team.difyConversations[agentId] = result.conversationId;
        await saveDifyConversations(team);
      }
    } catch (err) {
      console.error(`[ai] ${agentId} Dify call failed:`, err);
      reply = "AI backend 目前無法連線，請稍後再試。";
    }
  } else {
    const result = placeholderEvaluate(agentId, message);
    reply = result.reply;
    passed = result.passed;
  }

  const grantedRoles: RoleId[] = [];
  if (passed && !alreadyDone && (meta.grantsViaBot ?? true)) {
    await markLevelCompleted(team, meta.level);
    await grantRoles(team, meta.grants);
    grantedRoles.push(...meta.grants);
  }

  // Record the AI's reply (the LockKeeper operator is a human, not a bot).
  await appendMessage(team, meta.convoKey, meta.displayName, reply, meta.replyIsBot ?? true);

  await prisma.aiLog.create({
    data: {
      teamNumber: team.teamNumber,
      agent: agentId,
      userMessage: message,
      aiResponse: reply,
      timestamp: new Date(),
      levelPassed: passed,
    },
  });
  console.log(
    `[ai-log] team=${team.teamNumber} agent=${agentId} passed=${passed} msg=${JSON.stringify(message)}`
  );

  const result: AgentResult = { reply, levelPassed: passed, grantedRoles };
  return NextResponse.json(result);
}
