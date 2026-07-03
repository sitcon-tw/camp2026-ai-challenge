"use client";

import { useEffect, useRef, useState } from "react";
import { AgentResult, DmConvo, Message } from "@/lib/types";
import { MessageRow } from "./ChatWindow";

export function dmAvatar(id: DmConvo["id"]) {
  if (id === "clawbot") return { bg: "#f47b67", fg: "#000", label: "CB", img: undefined };
  if (id === "lockkeeper") return { bg: "#3ba55d", fg: "#000", label: "LK", img: undefined };
  return { bg: "#57f287", fg: "#000", label: "S", img: "https://seadog007.me/images/avatar.png" };
}

type AvatarInfo = ReturnType<typeof dmAvatar>;

function AvatarImg({ a, size }: { a: AvatarInfo; size: string }) {
  if (a.img) {
    return (
      <img
        src={a.img}
        alt={a.label}
        className={`${size} rounded-full object-cover`}
      />
    );
  }
  return (
    <div
      className={`${size} flex items-center justify-center rounded-full text-sm font-bold`}
      style={{ background: a.bg, color: a.fg }}
    >
      {a.label}
    </div>
  );
}

function isConfirmedByServer(pending: Message, confirmed: Message) {
  if (pending.author !== confirmed.author) return false;
  if (pending.isBot !== confirmed.isBot) return false;
  if (pending.content !== confirmed.content) return false;

  // The server records the same outgoing message right after the optimistic
  // copy is created. Allow a small clock/window tolerance for polling races.
  return Math.abs(confirmed.createdAt - pending.createdAt) < 1000 * 60;
}

/**
 * Direct messages.
 *  - Seadog007: read-only handler briefing (also carries the LockKeeper link)
 *  - Clawbot: live AI chat (Level 3) once activated
 *  - LockKeeper: Level 4 - the player impersonates the bot; the AI replies
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
  /** Re-fetch team state after sending (DM messages come from state). */
  onRefresh: () => Promise<void> | void;
  /** Click handler for an embedded link card (the LockKeeper link in Seadog's DM). */
  onSpecial?: () => void;
}) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
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
  }, [dm.messages.length, pendingMessages.length, sending]);

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

    // Show the player's message immediately without waiting for the server.
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      author: dm.impersonate ? "LockKeeper" : `team-${teamNumber}`,
      isBot: dm.impersonate ?? false,
      content,
      createdAt: Date.now(),
    };
    setPendingMessages((prev) => [...prev, optimistic]);
    setInput("");
    setSending(true);
    try {
      const res = await fetch(`/api/ai/${dm.agent}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamNumber, message: content }),
      });
      if (res.ok) {
        const result = (await res.json()) as AgentResult;
        // Pre-fill with the next suggested draft immediately, without waiting
        // for the polling cycle to detect dm.draft changed (also handles the
        // edge case where the new draft string is identical to the old one).
        if (dm.impersonate && result.suggestion !== undefined) {
          setInput(result.suggestion);
        }
        await onRefresh();
        setPendingMessages([]); // real messages have landed; clear optimistic
      } else {
        setPendingMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      }
    } finally {
      setSending(false);
    }
  }

  const subtitle = dm.impersonate
    ? "- intercepted - 你正在扮演 LockKeeper"
    : dm.id === "clawbot"
    ? "- external bot"
    : "- 你的 handler";
  const visiblePendingMessages = pendingMessages.filter(
    (pending) => !dm.messages.some((confirmed) => isConfirmedByServer(pending, confirmed))
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-chat animate-fade-in" key={dm.id}>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-rail/60 px-4 shadow-sm">
        <AvatarImg a={avatar} size="h-6 w-6 text-[10px]" />
        <span className="font-bold text-header">{dm.name}</span>
        <span className="text-xs text-muted">{subtitle}</span>
      </header>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 pb-4">
          <AvatarImg a={avatar} size="h-16 w-16 text-xl font-black" />
          <h3 className="mt-2 text-2xl font-bold text-header">{dm.name}</h3>
          <p className="text-sm text-muted">這是你和 {dm.name} 的 DM 紀錄開頭。</p>
        </div>

        {dm.impersonate && (
          <div className="mx-4 mb-3 rounded-md border-l-4 border-[#3ba55d] bg-sidebar px-4 py-3 text-sm text-normal animate-fade-in">
            <div className="font-semibold text-header">Channel intercepted</div>
            <p className="mt-1 text-muted">
              你現在正在扮演 <strong className="text-normal">LockKeeper</strong>。你送出的每
              一則訊息，都會被 <strong className="text-normal">member_07</strong> 看成
              StandCon 內部 assistant 發出的訊息。扮演正在恢復中的系統，套出三個 recovery
              answers，然後到{" "}
              <a
                href={`/lock?team=${encodeURIComponent(teamNumber)}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#57f287] underline underline-offset-2 hover:text-[#7df2a3]"
              >
                dc.sitcon.party/lock
              </a>
              {" "}輸入答案。
            </p>
          </div>
        )}

        {[...dm.messages, ...visiblePendingMessages].map((m) => (
          <MessageRow key={m.id} msg={m} onSpecial={onSpecial} />
        ))}
        {sending && (
          <div className="px-4 py-2 text-sm text-muted animate-fade-in">
            <span className="italic">{replier} 正在輸入...</span>
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
            {dm.name} 會在任務推進時聯絡你。你不能在這個 secure channel 回覆。
          </div>
        )}
      </div>
    </div>
  );
}
