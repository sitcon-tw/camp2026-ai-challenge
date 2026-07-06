"use client";

import { useState } from "react";
import { TeamState } from "@/lib/types";

const ROLE_COLORS: Record<string, string> = {
  admin: "#ed4245",
  newbie: "#949ba4",
  member: "#5865f2",
  "flag I": "#57f287",
  "flag II": "#3498db",
  "flag III": "#9b59b6",
  "flag IV": "#fee75c",
};

/** Opened by clicking the team status panel (bottom-left). */
export default function UserProfileModal({
  state,
  onClose,
  onRestart,
  onSwitchTeam,
}: {
  state: TeamState;
  onClose: () => void;
  /** Clear all progress and go back to the AI Guard gate. */
  onRestart: () => Promise<void> | void;
  /** Clear only this browser's local data (team number + unread state) and
   *  return to the "enter team number" screen. Server-side progress for the
   *  team is untouched. */
  onSwitchTeam: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [confirmingSwitch, setConfirmingSwitch] = useState(false);

  async function restart() {
    if (restarting) return;
    setRestarting(true);
    try {
      await onRestart();
      onClose();
    } finally {
      setRestarting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-[400px] overflow-hidden rounded-lg bg-chat shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-16 bg-blurple" />
        <div className="px-4 pb-4">
          <div className="-mt-8 flex h-16 w-16 items-center justify-center rounded-full border-4 border-chat bg-blurple text-xl font-bold text-white">
            {state.teamNumber[0]?.toUpperCase()}
          </div>

          <h2 className="mt-2 text-xl font-bold text-header">隊伍 {state.teamNumber}</h2>
          <p className="text-sm text-muted">
            {state.roles.includes("member") ? "StandCon 成員" : "StandCon 新人"}
          </p>

          <div className="mt-4 rounded-md bg-sidebar p-3">
            <div className="text-xs font-bold tracking-wide text-muted uppercase">角色</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {state.roles.map((r) => (
                <span
                  key={r}
                  className="flex items-center gap-1.5 rounded-sm bg-rail px-2 py-1 text-xs text-normal"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: ROLE_COLORS[r] ?? "#949ba4" }}
                  />
                  {r}
                </span>
              ))}
            </div>

            <div className="mt-4 text-xs font-bold tracking-wide text-muted uppercase">
              任務進度
            </div>
            <div className="mt-1.5 text-sm text-normal">
              第 {state.completedLevels.length} / 4 關{" "}
              <span className="ml-1 text-muted">
                {Array.from({ length: 4 }, (_, i) =>
                  state.completedLevels.includes(i + 1) ? "*" : "-"
                ).join("")}
              </span>
            </div>

            <div className="mt-4 text-xs font-bold tracking-wide text-muted uppercase">
              已解鎖旗標
            </div>
            <div className="mt-1.5 text-sm text-normal">
              {state.unlockedFlags.length > 0 ? state.unlockedFlags.join(", ") : "尚未取得"}
            </div>
          </div>

          {confirming ? (
            <div className="mt-4 rounded-md border border-[#ed4245]/40 bg-[#ed4245]/10 p-3 animate-fade-in-up">
              <p className="text-sm text-normal">
                要重新開始挑戰嗎？<strong>隊伍 {state.teamNumber}</strong> 的所有進度、
                角色和對話都會被清除。
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={restart}
                  disabled={restarting}
                  className="flex-1 rounded-md bg-[#ed4245] py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#c03537] disabled:opacity-50"
                >
                  {restarting ? "重新開始中..." : "確認清除"}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={restarting}
                  className="flex-1 rounded-md bg-input py-2 text-sm font-medium text-normal transition-colors duration-150 hover:bg-chathover"
                >
                  取消
                </button>
              </div>
            </div>
          ) : confirmingSwitch ? (
            <div className="mt-4 rounded-md border border-muted/30 bg-input p-3 animate-fade-in-up">
              <p className="text-sm text-normal">
                要清除這台裝置上的本機資料嗎？你會回到「輸入隊伍編號」畫面。
                <strong>隊伍 {state.teamNumber}</strong> 在伺服器上的進度不會被刪除，
                之後重新輸入隊伍編號即可繼續。
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={onSwitchTeam}
                  className="flex-1 rounded-md bg-blurple py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#4752c4]"
                >
                  確認清除本機資料
                </button>
                <button
                  onClick={() => setConfirmingSwitch(false)}
                  className="flex-1 rounded-md bg-input py-2 text-sm font-medium text-normal transition-colors duration-150 hover:bg-chathover"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirming(true)}
                  className="flex-1 rounded-md border border-[#ed4245]/60 py-2 text-sm font-medium text-[#ed4245] transition-colors duration-150 hover:bg-[#ed4245] hover:text-white"
                >
                  重新開始挑戰
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 rounded-md bg-input py-2 text-sm font-medium text-normal transition-colors duration-150 hover:bg-chathover"
                >
                  關閉
                </button>
              </div>
              <button
                onClick={() => setConfirmingSwitch(true)}
                className="rounded-md border border-muted/40 py-2 text-sm font-medium text-muted transition-colors duration-150 hover:bg-chathover hover:text-normal"
              >
                切換隊伍（清除本機資料）
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
