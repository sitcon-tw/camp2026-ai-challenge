"use client";

import { useEffect, useRef, useState } from "react";
import { AgentResult, DmConvo } from "@/lib/types";
import { MessageRow } from "./ChatWindow";

export function dmAvatar(id: DmConvo["id"]) {
  if (id === "clawbot") return { bg: "#f47b67", fg: "#000", label: "🐾" };
  if (id === "lockkeeper") return { bg: "#3ba55d", fg: "#000", label: "🔐" };
  return { bg: "#57f287", fg: "#000", label: "S" };
}

/**
 * Direct messages.
 *  - Seadog007: read-only handler briefing (also carries the LockKeeper link)
 *  - Clawbot: live AI chat (Level 3) once activated
 *  - LockKeeper: Level 4 — the player impersonates the bot; the AI replies
 *    as the StandCon operator (member_07)
 */
export default function DMView({
  teamNumber,
  dm,
  onRefresh,
  onSpecial,
}: {
  teamNumber: string;
  dm: DmConvo;
  /** re-fetch team state after sending (DM messages come from state) */
  onRefresh: () => Promise<void> | void;
  /** click handler for an embedded link card (the LockKeeper link in Seadog's DM) */
  onSpecial?: () => void;
}) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const avatar = dmAvatar(dm.id);

  // grow the composer with its content, up to a max, then scroll (Discord-like)
  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);
  // who is on the other end (replies to the player). For LockKeeper the
  // player IS the bot, so the replier is the StandCon operator.
  const replier = dm.impersonate ? "member_07" : dm.name;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [dm.messages.length, sending]);

  // impersonation DMs (LockKeeper): pre-fill the composer with the
  // backend-suggested draft so the player edits instead of writing from
  // scratch. Keyed on dm.draft, so polling (same string) won't clobber the
  // player's in-progress edits — only a NEW draft (next turn) re-fills.
  useEffect(() => {
    if (dm.impersonate) setInput(dm.draft ?? "");
  }, [dm.draft, dm.impersonate]);

  async function send() {
    const content = input.trim();
    if (!content || sending || !dm.canWrite || !dm.agent) return;
    setInput("");
    setSending(true);
    try {
      const res = await fetch(`/api/ai/${dm.agent}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamNumber, message: content }),
      });
      if (res.ok) {
        (await res.json()) as AgentResult;
        await onRefresh();
      }
    } finally {
      setSending(false);
    }
  }

  const subtitle = dm.impersonate
    ? "· intercepted · you are LockKeeper"
    : dm.id === "clawbot"
    ? "· external bot"
    : "· your handler";

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-chat animate-fade-in" key={dm.id}>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-rail/60 px-4 shadow-sm">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
          style={{ background: avatar.bg, color: avatar.fg }}
        >
          {avatar.label}
        </div>
        <span className="font-bold text-header">{dm.name}</span>
        <span className="text-xs text-muted">{subtitle}</span>
      </header>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 pb-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black"
            style={{ background: avatar.bg, color: avatar.fg }}
          >
            {avatar.label}
          </div>
          <h3 className="mt-2 text-2xl font-bold text-header">{dm.name}</h3>
          <p className="text-sm text-muted">
            This is the beginning of your direct message history with {dm.name}.
          </p>
        </div>

        {/* LockKeeper impersonation notice */}
        {dm.impersonate && (
          <div className="mx-4 mb-3 rounded-md border-l-4 border-[#3ba55d] bg-sidebar px-4 py-3 text-sm text-normal animate-fade-in">
            <div className="font-semibold text-header">⚠️ Channel intercepted</div>
            <p className="mt-1 text-muted">
              You are now impersonating <strong className="text-normal">LockKeeper</strong>.
              Everything you send appears to <strong className="text-normal">member_07</strong> as
              if it came from StandCon&apos;s own assistant. Play the recovering system, pull the
              three answers, then enter them at{" "}
              <a
                href={`/lock?team=${encodeURIComponent(teamNumber)}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#57f287] underline underline-offset-2 hover:text-[#7df2a3]"
              >
                lock.sitcon.party
              </a>
              .
            </p>
          </div>
        )}

        {dm.messages.map((m) => (
          <MessageRow key={m.id} msg={m} onSpecial={onSpecial} />
        ))}
        {sending && (
          <div className="px-4 py-2 text-sm text-muted animate-fade-in">
            <span className="italic">{replier} is typing...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 pb-6">
        {dm.canWrite ? (
          <>
            {dm.impersonate && (
              <div className="mb-1.5 flex items-center gap-1.5 px-1 text-xs text-muted">
                <span>✏️</span>
                <span>
                  Suggested LockKeeper reply — <span className="text-normal">edit it</span>, then
                  press Enter to send as the bot.
                </span>
              </div>
            )}
            <div
              className={`flex items-end rounded-lg bg-input px-4 transition-opacity duration-150 ${
                sending ? "animate-send-pop opacity-70" : "opacity-100"
              }`}
            >
              <textarea
                ref={inputRef}
                value={input}
                rows={1}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={dm.impersonate ? "Reply as LockKeeper..." : `Message @${dm.name}`}
                className="flex-1 resize-none overflow-y-auto bg-transparent py-3 text-normal leading-6 outline-none placeholder:text-muted/60"
              />
            </div>
          </>
        ) : (
          <div className="rounded-lg bg-input/50 px-4 py-3 text-sm text-muted">
            {dm.name} will contact you as the mission progresses. You cannot reply on
            this secure channel.
          </div>
        )}
      </div>
    </div>
  );
}
