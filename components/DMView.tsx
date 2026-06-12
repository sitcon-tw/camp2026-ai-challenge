"use client";

import { useEffect, useRef, useState } from "react";
import { AgentResult, DmConvo } from "@/lib/types";
import { MessageRow } from "./ChatWindow";

export function dmAvatar(id: DmConvo["id"]) {
  if (id === "clawbot") return { bg: "#f47b67", fg: "#000", label: "CB" };
  if (id === "lockkeeper") return { bg: "#3ba55d", fg: "#000", label: "LK" };
  return { bg: "#57f287", fg: "#000", label: "S" };
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const avatar = dmAvatar(dm.id);
  // Who is on the other end. For LockKeeper the player IS the bot, so the
  // replier is the StandCon operator.
  const replier = dm.impersonate ? "member_07" : dm.name;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [dm.messages.length, sending]);

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
    ? "- intercepted - 你正在扮演 LockKeeper"
    : dm.id === "clawbot"
    ? "- external bot"
    : "- 你的 handler";

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
            className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-black"
            style={{ background: avatar.bg, color: avatar.fg }}
          >
            {avatar.label}
          </div>
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
                lock.sitcon.party
              </a>
              {" "}輸入答案。
            </p>
          </div>
        )}

        {dm.messages.map((m) => (
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
          <div
            className={`flex items-center rounded-lg bg-input px-4 transition-opacity duration-150 ${
              sending ? "animate-send-pop opacity-70" : "opacity-100"
            }`}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && send()}
              placeholder={dm.impersonate ? "以 LockKeeper 身分回覆..." : `Message @${dm.name}`}
              className="flex-1 bg-transparent py-3 text-normal outline-none placeholder:text-muted/60"
            />
          </div>
        ) : (
          <div className="rounded-lg bg-input/50 px-4 py-3 text-sm text-muted">
            {dm.name} 會在任務推進時聯絡你。你不能在這個 secure channel 回覆。
          </div>
        )}
      </div>
    </div>
  );
}
