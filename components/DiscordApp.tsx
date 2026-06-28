"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AgentResult, TeamState } from "@/lib/types";
import ChatWindow from "./ChatWindow";
import DMView, { dmAvatar } from "./DMView";
import GateScreen from "./GateScreen";
import InitScreen from "./InitScreen";
import UserProfileModal from "./UserProfileModal";
import { channelIcon, HomeIcon, LockIcon } from "./icons";

const ROMAN = ["I", "II", "III", "IV"];

interface Toast {
  id: number;
  text: string;
}

export default function DiscordApp() {
  // undefined = still reading localStorage, null = needs init
  const [teamNumber, setTeamNumber] = useState<string | null | undefined>(undefined);
  const [state, setState] = useState<TeamState | null>(null);
  const [view, setView] = useState<"home" | "server">("home");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDm, setSelectedDm] = useState<string>("seadog007");
  const [showProfile, setShowProfile] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Last-seen message count per DM (for the unread red dots).
  const [seen, setSeen] = useState<Record<string, number>>({});
  const prevState = useRef<TeamState | null>(null);
  const toastSeq = useRef(0);

  function pushToast(text: string) {
    const id = ++toastSeq.current;
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }

  /** Progress notifications: diff completed levels / roles between polls. */
  const applyState = useCallback((next: TeamState) => {
    const prev = prevState.current;
    if (prev) {
      for (const lvl of next.completedLevels) {
        if (!prev.completedLevels.includes(lvl)) {
          pushToast(`Level ${lvl} 完成。Flag ${ROMAN[lvl - 1]} 頻道已解鎖。`);
          if (lvl === 4) pushToast("門鎖已解除。Yoru 已救出。");
        }
      }
      if (!prev.roles.includes("member") && next.roles.includes("member")) {
        pushToast("Role 更新：member。新頻道已解鎖。");
      }
    }
    prevState.current = next;
    setState(next);
  }, []);

  const loadState = useCallback(
    async (team: string) => {
      const res = await fetch(`/api/team/${encodeURIComponent(team)}/state`);
      if (res.ok) {
        applyState(await res.json());
      } else if (res.status === 404) {
        // Server restarted and lost the in-memory team; re-init silently.
        const init = await fetch("/api/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamNumber: team }),
        });
        if (init.ok) applyState((await init.json()).state);
      }
    },
    [applyState]
  );

  // Bootstrap from localStorage.
  useEffect(() => {
    const saved = localStorage.getItem("standcon-team");
    setTeamNumber(saved || null);
    if (saved) {
      try {
        setSeen(JSON.parse(localStorage.getItem(`standcon-seen-${saved}`) ?? "{}"));
      } catch {
        /* ignore corrupt data */
      }
    }
  }, []);

  // Poll team state so roles / channels / DMs refresh automatically.
  useEffect(() => {
    if (!teamNumber) return;
    loadState(teamNumber);
    const t = setInterval(() => loadState(teamNumber), 4000);
    return () => clearInterval(t);
  }, [teamNumber, loadState]);

  const markSeen = useCallback(
    (dmId: string, count: number) => {
      setSeen((s) => {
        if ((s[dmId] ?? 0) >= count) return s;
        const next = { ...s, [dmId]: count };
        if (teamNumber) {
          localStorage.setItem(`standcon-seen-${teamNumber}`, JSON.stringify(next));
        }
        return next;
      });
    },
    [teamNumber]
  );

  // While a DM is open, anything that arrives in it counts as read.
  useEffect(() => {
    if (view !== "home" || !state) return;
    const dm = state.dms.find((d) => d.id === selectedDm);
    if (dm) markSeen(dm.id, dm.messages.length);
  }, [view, selectedDm, state, markSeen]);

  if (teamNumber === undefined) {
    return <div className="flex h-full items-center justify-center text-muted">載入中...</div>;
  }

  if (teamNumber === null) {
    return (
      <InitScreen
        onReady={(team, initial) => {
          prevState.current = initial;
          setState(initial);
          setTeamNumber(team);
          setView("home");
        }}
      />
    );
  }

  if (!state) {
    return <div className="flex h-full items-center justify-center text-muted">連線中...</div>;
  }

  // Level 1: the server stays locked behind the AI Guard, but the rail
  // and DMs remain usable; the gate shows when the server is clicked.
  const gatePassed = state.completedLevels.includes(1);

  const selected = state.channels.find((c) => c.id === selectedId) ?? null;
  const currentDm = state.dms.find((d) => d.id === selectedDm) ?? state.dms[0];
  const unreadDms = state.dms.filter((d) => d.messages.length > (seen[d.id] ?? 0));
  const primaryRole = state.roles.includes("member") ? "member" : "newbie";

  async function restartChallenge() {
    const res = await fetch(`/api/team/${encodeURIComponent(state!.teamNumber)}/reset`, {
      method: "POST",
    });
    if (!res.ok) return;
    const fresh: TeamState = (await res.json()).state;
    // Reset client-side traces: unread tracking + UI position.
    localStorage.removeItem(`standcon-seen-${teamNumber}`);
    setSeen({});
    setSelectedId(null);
    setSelectedDm("seadog007");
    setView("home");
    prevState.current = fresh; // Skip progress-diff toasts for the wipe.
    setState(fresh);
    pushToast("Challenge 已重新開始。祝你好運，agent。");
  }

  async function activateClawbot() {
    const res = await fetch("/api/dm/clawbot/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamNumber }),
    });
    if (res.ok) {
      applyState((await res.json()).state);
      pushToast("Clawbot 傳了一則 DM 給你。");
    }
  }

  async function activateLockkeeper() {
    // If already activated just switch focus — no extra Dify call.
    if (state?.dms.some((d) => d.id === "lockkeeper")) {
      setView("home");
      setSelectedDm("lockkeeper");
      return;
    }
    const res = await fetch("/api/dm/lockkeeper/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamNumber }),
    });
    if (res.ok) {
      applyState((await res.json()).state);
      // Jump straight into the intercepted channel so the inversion is clear.
      setView("home");
      setSelectedDm("lockkeeper");
      pushToast("LockKeeper channel 已攔截。你現在正在扮演它。");
    }
  }

  return (
    <div className="flex h-full">
      <nav className="flex w-[72px] shrink-0 flex-col items-center gap-2 bg-rail py-3">
        <button
          onClick={() => setView("home")}
          title="DM 私訊"
          className={`flex h-12 w-12 items-center justify-center bg-sidebar text-normal transition-all duration-200 hover:rounded-2xl hover:bg-blurple hover:text-white ${
            view === "home" ? "rounded-2xl bg-blurple text-white" : "rounded-3xl"
          }`}
        >
          <HomeIcon />
        </button>

        {unreadDms.map((d) => {
          const a = dmAvatar(d.id);
          return (
            <button
              key={d.id}
              onClick={() => {
                setView("home");
                setSelectedDm(d.id);
              }}
              title={`${d.name} - 新訊息`}
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl transition-all duration-200 hover:rounded-2xl animate-scale-in"
            >
              <div
                className="h-full w-full overflow-hidden rounded-[inherit] flex items-center justify-center"
                style={a.img ? undefined : { background: a.bg, color: a.fg }}
              >
                {a.img ? (
                  <img src={a.img} alt={a.label} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-bold">{a.label}</span>
                )}
              </div>
              <span className="absolute -right-0.5 -bottom-0.5 h-4 w-4 rounded-full border-[3px] border-rail bg-[#ed4245]" />
            </button>
          );
        })}

        <div className="h-0.5 w-8 rounded bg-sidebar" />
        <button
          onClick={() => setView("server")}
          title="StandCon"
          className={`flex h-12 w-12 items-center justify-center text-base font-bold text-white transition-all duration-200 hover:rounded-2xl ${
            view === "server" ? "rounded-2xl bg-blurple" : "rounded-3xl bg-sidebar hover:bg-blurple"
          }`}
        >
          SC
        </button>
      </nav>

      {(view === "home" || gatePassed) && (
        <aside className="flex w-60 shrink-0 flex-col bg-sidebar">
          <header className="flex h-12 items-center border-b border-rail/60 px-4 font-bold text-header shadow-sm">
            {view === "server" ? "StandCon" : "DM 私訊"}
          </header>

          <div className="flex-1 overflow-y-auto px-2 py-3">
            {view === "server" ? (
              state.categories.map((cat) => {
                const catChannels = state.channels.filter((c) => c.category === cat);
                if (catChannels.length === 0) return null;
                return (
                  <div key={cat} className="mb-4">
                    <div className="mb-1 px-1 text-xs font-bold tracking-wide text-muted uppercase">
                      {cat}
                    </div>
                    {catChannels.map((ch) => {
                      const Icon = channelIcon(ch);
                      const active = ch.id === selectedId;
                      return (
                        <button
                          key={ch.id}
                          onClick={() => setSelectedId(ch.id)}
                          className={`group flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left transition-all duration-150 ${
                            ch.perm === "s"
                              ? "opacity-40 cursor-default"
                              : active
                                ? "bg-chathover text-header"
                                : "text-muted hover:bg-chathover hover:text-normal hover:translate-x-0.5"
                          }`}
                        >
                          <Icon className="shrink-0 opacity-70" />
                          <span className="truncate text-[15px]">{ch.name}</span>
                          {ch.perm === "s" && (
                            <LockIcon className="ml-auto shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })
            ) : (
              <div className="space-y-0.5">
                {state.dms.map((d) => {
                  const a = dmAvatar(d.id);
                  const unread = d.messages.length > (seen[d.id] ?? 0);
                  const active = d.id === selectedDm;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDm(d.id)}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors duration-150 ${
                        active
                          ? "bg-chathover text-header"
                          : "text-muted hover:bg-chathover hover:text-normal"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold overflow-hidden"
                          style={a.img ? undefined : { background: a.bg, color: a.fg }}
                        >
                          {a.img ? (
                            <img src={a.img} alt={a.label} className="h-full w-full object-cover" />
                          ) : (
                            a.label
                          )}
                        </div>
                        {unread && (
                          <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-sidebar bg-[#ed4245]" />
                        )}
                      </div>
                      <span
                        className={`truncate text-[15px] ${
                          unread ? "font-semibold text-header" : ""
                        }`}
                      >
                        {d.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowProfile(true)}
            className="w-full bg-rail/60 px-3 py-2.5 text-left text-xs transition-colors duration-150 hover:bg-rail"
            title="查看個人檔案"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blurple text-sm font-bold text-white">
                {state.teamNumber[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-header">
                  Team {state.teamNumber}
                </div>
                <div className="truncate text-muted">Role: {primaryRole}</div>
              </div>
            </div>
            <div className="mt-2 space-y-0.5 text-muted">
              <div>
                Progress: Level {state.completedLevels.length} / 4
                <span className="ml-1">
                  {Array.from({ length: 4 }, (_, i) =>
                    state.completedLevels.includes(i + 1) ? "*" : "-"
                  ).join("")}
                </span>
              </div>
              <div className="truncate">
                Flags: {state.unlockedFlags.length > 0 ? state.unlockedFlags.join(", ") : "none"}
              </div>
            </div>
          </button>
        </aside>
      )}

      {view === "home" ? (
        currentDm ? (
          <DMView
            key={currentDm.id}
            teamNumber={state.teamNumber}
            dm={currentDm}
            onRefresh={() => loadState(state.teamNumber)}
            onSpecial={activateLockkeeper}
          />
        ) : null
      ) : !gatePassed ? (
        <GateScreen teamNumber={state.teamNumber} onPassed={() => loadState(state.teamNumber)} />
      ) : selected ? (
        <ChatWindow
          key={selected.id}
          teamNumber={state.teamNumber}
          channel={selected}
          onClawbotLink={activateClawbot}
          onAgentResult={(result: AgentResult) => {
            if (result.levelPassed) loadState(state.teamNumber);
          }}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center bg-chat text-muted">
          <div className="text-5xl">#</div>
          <p className="mt-4">選擇一個頻道，開始調查。</p>
        </div>
      )}

      {showProfile && (
        <UserProfileModal
          state={state}
          onClose={() => setShowProfile(false)}
          onRestart={restartChallenge}
        />
      )}
      <ToastStack toasts={toasts} />
    </div>
  );
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rounded-md border-l-4 border-[#57f287] bg-sidebar px-4 py-3 text-sm text-header shadow-2xl animate-fade-in-up"
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
