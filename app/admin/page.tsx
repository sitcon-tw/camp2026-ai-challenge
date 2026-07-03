import {
  deleteAllDataAction,
  deleteTeamAction,
  loginAction,
  logoutAction,
  resetAllStatsAction,
  resetTeamAction,
  setTeamLevelsAction,
} from "./actions";
import { adminAccount, isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{ error?: string }>;
};

type TeamRow = Awaited<ReturnType<typeof loadAdminData>>["teams"][number];

function parseLevels(value: string): number[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((level) => Number.isInteger(level)).sort((a, b) => a - b)
      : [];
  } catch {
    return [];
  }
}

function parseRoles(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
  }).format(value);
}

async function loadAdminData() {
  const [teams, messageCount, aiLogCount] = await Promise.all([
    prisma.team.findMany({
      orderBy: { teamNumber: "asc" },
      include: {
        _count: {
          select: { channelMessages: true, aiLogs: true },
        },
        channelMessages: {
          orderBy: { createdAt: "desc" },
          take: 6,
        },
        aiLogs: {
          orderBy: { timestamp: "desc" },
          take: 6,
        },
      },
    }),
    prisma.channelMessage.count(),
    prisma.aiLog.count(),
  ]);

  const levelCounts = [1, 2, 3, 4].map((level) => ({
    level,
    count: teams.filter((team) => parseLevels(team.completedLevels).includes(level)).length,
  }));

  return {
    teams,
    stats: {
      teamCount: teams.length,
      messageCount,
      aiLogCount,
      levelCounts,
    },
  };
}

function LoginPage({ error }: { error?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-rail px-4 text-normal">
      <section className="w-full max-w-sm rounded-lg border border-white/10 bg-sidebar p-6 shadow-2xl">
        <h1 className="text-xl font-semibold text-header">StandCon Admin</h1>
        <p className="mt-2 text-sm text-muted">Enter the operator account and env password.</p>
        {!isAdminConfigured() ? (
          <div className="mt-5 rounded-md border border-yellow-400/30 bg-yellow-400/10 p-3 text-sm text-yellow-100">
            Set <code>ADMIN_PASSWORD</code> in <code>.env</code> before using this page.
          </div>
        ) : null}
        {error ? (
          <div className="mt-5 rounded-md border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">
            Login failed. Check the account and password.
          </div>
        ) : null}
        <form action={loginAction} className="mt-5 space-y-4">
          <label className="block text-sm">
            <span className="text-muted">Account</span>
            <input
              name="account"
              defaultValue={adminAccount()}
              className="mt-1 w-full rounded-md border border-white/10 bg-input px-3 py-2 text-header outline-none focus:border-blurple"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Password</span>
            <input
              name="password"
              type="password"
              className="mt-1 w-full rounded-md border border-white/10 bg-input px-3 py-2 text-header outline-none focus:border-blurple"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-md bg-blurple px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
          >
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-white/10 bg-sidebar p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-header">{value}</div>
    </div>
  );
}

function DangerButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-100 hover:bg-red-500/20"
    >
      {children}
    </button>
  );
}

function TeamPanel({ team }: { team: TeamRow }) {
  const levels = parseLevels(team.completedLevels);
  const roles = parseRoles(team.roles);

  return (
    <details className="rounded-md border border-white/10 bg-sidebar">
      <summary className="cursor-pointer list-none px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-header">Team {team.teamNumber}</div>
            <div className="mt-1 text-xs text-muted">
              Created {formatDate(team.createdAt)} · {team._count.channelMessages} messages ·{" "}
              {team._count.aiLogs} AI logs
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {roles.map((role) => (
              <span key={role} className="rounded bg-input px-2 py-1 text-normal">
                {role}
              </span>
            ))}
          </div>
        </div>
      </summary>

      <div className="grid gap-4 border-t border-white/10 p-4 lg:grid-cols-[1fr_1fr]">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-header">Progress</h2>
          <form action={setTeamLevelsAction} className="space-y-3 rounded-md bg-chat p-3">
            <input type="hidden" name="teamNumber" value={team.teamNumber} />
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              {[1, 2, 3, 4].map((level) => (
                <label key={level} className="flex items-center gap-2 rounded bg-input px-3 py-2">
                  <input
                    name="levels"
                    type="checkbox"
                    value={level}
                    defaultChecked={levels.includes(level)}
                    className="accent-blurple"
                  />
                  Level {level}
                </label>
              ))}
            </div>
            <button
              type="submit"
              className="rounded-md bg-blurple px-3 py-2 text-sm font-semibold text-white hover:brightness-110"
            >
              Apply levels
            </button>
          </form>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-md bg-chat p-3 text-sm">
              <div className="text-muted">Clawbot DM</div>
              <div className="mt-1 text-header">{team.clawbotActivated ? "Activated" : "Closed"}</div>
            </div>
            <div className="rounded-md bg-chat p-3 text-sm">
              <div className="text-muted">LockKeeper DM</div>
              <div className="mt-1 text-header">
                {team.lockkeeperActivated ? "Activated" : "Closed"}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <form action={resetTeamAction}>
              <input type="hidden" name="teamNumber" value={team.teamNumber} />
              <DangerButton>Reset team stats</DangerButton>
            </form>
            <form action={deleteTeamAction}>
              <input type="hidden" name="teamNumber" value={team.teamNumber} />
              <DangerButton>Delete team data</DangerButton>
            </form>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-header">Recent AI Logs</h2>
            <div className="mt-2 space-y-2">
              {team.aiLogs.length ? (
                team.aiLogs.map((log) => (
                  <article key={log.id} className="rounded-md bg-chat p-3 text-sm">
                    <div className="flex items-center justify-between gap-2 text-xs text-muted">
                      <span>{log.agent}</span>
                      <span>{formatDate(log.timestamp)}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-normal">{log.userMessage}</p>
                    <p className="mt-1 line-clamp-2 text-muted">{log.aiResponse}</p>
                  </article>
                ))
              ) : (
                <p className="rounded-md bg-chat p-3 text-sm text-muted">No AI logs yet.</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-header">Recent Messages</h2>
            <div className="mt-2 space-y-2">
              {team.channelMessages.length ? (
                team.channelMessages.map((message) => (
                  <article key={message.id} className="rounded-md bg-chat p-3 text-sm">
                    <div className="flex items-center justify-between gap-2 text-xs text-muted">
                      <span>
                        #{message.channelId} · {message.author}
                      </span>
                      <span>{formatDate(message.createdAt)}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-normal">{message.content}</p>
                  </article>
                ))
              ) : (
                <p className="rounded-md bg-chat p-3 text-sm text-muted">No team messages yet.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </details>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [{ error }, authed] = await Promise.all([searchParams, isAdminAuthenticated()]);
  if (!authed) return <LoginPage error={error} />;

  const { teams, stats } = await loadAdminData();

  return (
    <main className="h-screen overflow-y-auto bg-rail px-4 py-6 text-normal">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-header">Database Admin</h1>
            <p className="mt-1 text-sm text-muted">
              View team progress, inspect dialogs, reset stats, and edit level completion.
            </p>
          </div>
          <form action={logoutAction}>
            <button className="rounded-md border border-white/10 px-3 py-2 text-sm text-normal hover:bg-white/5">
              Sign out
            </button>
          </form>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          <StatCard label="Teams" value={stats.teamCount} />
          <StatCard label="Messages" value={stats.messageCount} />
          <StatCard label="AI Logs" value={stats.aiLogCount} />
          {stats.levelCounts.map((item) => (
            <StatCard key={item.level} label={`Level ${item.level} passed`} value={item.count} />
          ))}
        </section>

        <section className="rounded-md border border-red-400/30 bg-red-500/5 p-4">
          <h2 className="font-semibold text-red-100">Global actions</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <form action={resetAllStatsAction}>
              <DangerButton>Reset all stats</DangerButton>
            </form>
            <form action={deleteAllDataAction} className="flex flex-wrap items-center gap-2">
              <input
                name="confirm"
                placeholder="Type DELETE"
                className="rounded-md border border-red-400/30 bg-input px-3 py-2 text-sm text-header outline-none"
              />
              <DangerButton>Delete all data</DangerButton>
            </form>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-header">Teams</h2>
          {teams.length ? (
            teams.map((team) => <TeamPanel key={team.teamNumber} team={team} />)
          ) : (
            <div className="rounded-md border border-white/10 bg-sidebar p-6 text-sm text-muted">
              No teams in the database yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
