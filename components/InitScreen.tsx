"use client";

import { useState } from "react";
import { TeamState } from "@/lib/types";

/**
 * First-time initialization screen: asks for the team number,
 * calls POST /api/init, then hands the loaded state to the app.
 */
export default function InitScreen({
  onReady,
}: {
  onReady: (teamNumber: string, state: TeamState) => void;
}) {
  const [teamNumber, setTeamNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const n = teamNumber.trim();
    if (!n || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamNumber: n }),
      });
      if (!res.ok) throw new Error("init failed");
      const data = await res.json();
      localStorage.setItem("standcon-team", n);
      onReady(n, data.state);
    } catch {
      setError("初始化失敗，請再試一次。");
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full items-center justify-center bg-rail">
      <div className="w-[420px] rounded-lg bg-chat p-8 shadow-2xl animate-scale-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blurple text-xl font-black text-white shadow-lg">
          SC
        </div>
        <h1 className="mt-5 text-center text-2xl font-bold text-header">SITCON 遊戲</h1>
        <p className="mt-1 text-center text-sm text-muted">
          任務：滲透 <span className="font-semibold text-normal">StandCon</span>，救出 Yoru。
        </p>

        <label className="mt-7 mb-2 block text-xs font-bold tracking-wide text-muted uppercase">
          輸入隊伍編號
        </label>
        <input
          autoFocus
          value={teamNumber}
          onChange={(e) => setTeamNumber(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="請輸入數字"
          className="w-full rounded-sm bg-rail p-3 text-normal outline-none placeholder:text-muted/60"
        />
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        <button
          onClick={submit}
          disabled={busy || !teamNumber.trim()}
          className="mt-5 w-full rounded-md bg-blurple py-3 font-medium text-white transition-colors duration-150 hover:bg-[#4752c4] disabled:opacity-50"
        >
          {busy ? "連線中..." : "開始滲透"}
        </button>
      </div>
    </div>
  );
}
