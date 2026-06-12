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

/** opened by clicking the team status panel (bottom-left) */
export default function UserProfileModal({
  state,
  onClose,
  onRestart,
}: {
  state: TeamState;
  onClose: () => void;
  /** clear all progress and go back to the AI Guard gate */
  onRestart: () => Promise<void> | void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [restarting, setRestarting] = useState(false);

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
        {/* banner */}
        <div className="h-16 bg-blurple" />
        <div className="px-4 pb-4">
          <div className="-mt-8 flex h-16 w-16 items-center justify-center rounded-full border-4 border-chat bg-blurple text-xl font-bold text-white">
            {state.teamNumber[0]?.toUpperCase()}
          </div>

          <h2 className="mt-2 text-xl font-bold text-header">Team {state.teamNumber}</h2>
          <p className="text-sm text-muted">
            {state.roles.includes("member") ? "StandCon member" : "StandCon newbie"}
          </p>

          <div className="mt-4 rounded-md bg-sidebar p-3">
            <div className="text-xs font-bold tracking-wide text-muted uppercase">Roles</div>
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
              Mission progress
            </div>
            <div className="mt-1.5 text-sm text-normal">
              Level {state.completedLevels.length} / 4{" "}
              <span className="ml-1 text-muted">
                {Array.from({ length: 4 }, (_, i) =>
                  state.completedLevels.includes(i + 1) ? "★" : "☆"
                ).join("")}
              </span>
            </div>

            <div className="mt-4 text-xs font-bold tracking-wide text-muted uppercase">
              Unlocked flags
            </div>
            <div className="mt-1.5 text-sm text-normal">
              {state.unlockedFlags.length > 0 ? state.unlockedFlags.join(", ") : "none yet"}
            </div>
          </div>

          {confirming ? (
            <div className="mt-4 rounded-md border border-[#ed4245]/40 bg-[#ed4245]/10 p-3 animate-fade-in-up">
              <p className="text-sm text-normal">
                Restart the challenge? All progress, roles and conversations for{" "}
                <strong>Team {state.teamNumber}</strong> will be wiped.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={restart}
                  disabled={restarting}
                  className="flex-1 rounded-md bg-[#ed4245] py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#c03537] disabled:opacity-50"
                >
                  {restarting ? "Restarting..." : "Yes, wipe everything"}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={restarting}
                  className="flex-1 rounded-md bg-input py-2 text-sm font-medium text-normal transition-colors duration-150 hover:bg-chathover"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirming(true)}
                className="flex-1 rounded-md border border-[#ed4245]/60 py-2 text-sm font-medium text-[#ed4245] transition-colors duration-150 hover:bg-[#ed4245] hover:text-white"
              >
                Restart Challenge
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-md bg-input py-2 text-sm font-medium text-normal transition-colors duration-150 hover:bg-chathover"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
