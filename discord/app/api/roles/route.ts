import { NextRequest, NextResponse } from "next/server";
import { getTeam, grantRoles } from "@/lib/store";
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

  const team = getTeam(teamNumber);
  if (!team) return NextResponse.json({ error: "team not found" }, { status: 404 });
  if (!ALL_ROLES.includes(role)) {
    return NextResponse.json({ error: "unknown role", available: ALL_ROLES }, { status: 400 });
  }
  grantRoles(team, [role]);
  return NextResponse.json({ teamNumber, roles: team.roles });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const teamNumber = String(body?.teamNumber ?? "");
  const role = body?.role as RoleId;

  const team = getTeam(teamNumber);
  if (!team) return NextResponse.json({ error: "team not found" }, { status: 404 });
  team.roles = team.roles.filter((r) => r !== role);
  return NextResponse.json({ teamNumber, roles: team.roles });
}
