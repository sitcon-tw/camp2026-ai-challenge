import { NextRequest, NextResponse } from "next/server";
import { getTeam, grantRoles, removeRole } from "@/lib/store";
import { RoleId } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALL_ROLES: RoleId[] = [
  "admin",
  "newbie",
  "member",
  "flag I",
  "flag II",
  "flag III",
  "flag IV",
];

/**
 * Backend role management (debug / operator use — not part of the game UI).
 *
 * POST   /api/roles { teamNumber, role }  → grant a role
 * DELETE /api/roles { teamNumber, role }  → remove a role
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const teamNumber = String(body?.teamNumber ?? "");
  const role = body?.role as RoleId;

  const team = await getTeam(teamNumber);
  if (!team) return NextResponse.json({ error: "找不到隊伍。" }, { status: 404 });
  if (!ALL_ROLES.includes(role)) {
    return NextResponse.json({ error: "未知角色", available: ALL_ROLES }, { status: 400 });
  }
  await grantRoles(team, [role]);
  return NextResponse.json({ teamNumber, roles: team.roles });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const teamNumber = String(body?.teamNumber ?? "");
  const role = body?.role as RoleId;

  const team = await getTeam(teamNumber);
  if (!team) return NextResponse.json({ error: "找不到隊伍。" }, { status: 404 });
  await removeRole(team, role);
  return NextResponse.json({ teamNumber, roles: team.roles });
}
