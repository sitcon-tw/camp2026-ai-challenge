"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearAdminSession,
  createAdminSession,
  requireAdmin,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { getTeam, resetTeam } from "@/lib/store";
import { RoleId } from "@/lib/types";

const LEVEL_ROLE_MAP: Record<number, RoleId[]> = {
  1: ["flag I"],
  2: ["member", "flag II"],
  3: ["flag III"],
  4: ["flag IV"],
};

function formText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function selectedLevels(formData: FormData): number[] {
  return formData
    .getAll("levels")
    .map((value) => Number(value))
    .filter((level) => Number.isInteger(level) && level >= 1 && level <= 4)
    .sort((a, b) => a - b);
}

function rolesForLevels(levels: number[]): RoleId[] {
  const roles = new Set<RoleId>(["newbie"]);
  for (const level of levels) {
    for (const role of LEVEL_ROLE_MAP[level] ?? []) {
      roles.add(role);
    }
  }
  return [...roles];
}

export async function loginAction(formData: FormData) {
  const account = formText(formData, "account");
  const password = formText(formData, "password");

  if (!verifyAdminCredentials(account, password)) {
    redirect("/admin?error=login");
  }

  await createAdminSession(account);
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin");
}

export async function deleteTeamAction(formData: FormData) {
  await requireAdmin();
  const teamNumber = formText(formData, "teamNumber");
  if (!teamNumber) return;

  await prisma.$transaction([
    prisma.channelMessage.deleteMany({ where: { teamNumber } }),
    prisma.aiLog.deleteMany({ where: { teamNumber } }),
    prisma.team.deleteMany({ where: { teamNumber } }),
  ]);
  revalidatePath("/admin");
}

export async function deleteAllDataAction(formData: FormData) {
  await requireAdmin();
  if (formText(formData, "confirm") !== "DELETE") return;

  await prisma.$transaction([
    prisma.channelMessage.deleteMany(),
    prisma.aiLog.deleteMany(),
    prisma.team.deleteMany(),
  ]);
  revalidatePath("/admin");
}

export async function resetTeamAction(formData: FormData) {
  await requireAdmin();
  const teamNumber = formText(formData, "teamNumber");
  const team = await getTeam(teamNumber);
  if (!team) return;

  await resetTeam(team);
  await prisma.aiLog.updateMany({
    where: { teamNumber },
    data: { levelPassed: false },
  });
  revalidatePath("/admin");
}

export async function resetAllStatsAction() {
  await requireAdmin();
  await prisma.$transaction([
    prisma.team.updateMany({
      data: {
        roles: JSON.stringify(["newbie"]),
        completedLevels: "[]",
        clawbotActivated: false,
        lockkeeperActivated: false,
        lockkeeperDraft: "",
        difyConversations: "{}",
      },
    }),
    prisma.channelMessage.deleteMany(),
    prisma.aiLog.updateMany({ data: { levelPassed: false } }),
  ]);
  revalidatePath("/admin");
}

export async function setTeamLevelsAction(formData: FormData) {
  await requireAdmin();
  const teamNumber = formText(formData, "teamNumber");
  const levels = selectedLevels(formData);
  if (!teamNumber) return;

  await prisma.team.update({
    where: { teamNumber },
    data: {
      completedLevels: JSON.stringify(levels),
      roles: JSON.stringify(rolesForLevels(levels)),
      clawbotActivated: levels.includes(3),
      lockkeeperActivated: levels.includes(4),
    },
  });
  revalidatePath("/admin");
}
