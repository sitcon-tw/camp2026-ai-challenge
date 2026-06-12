"use client";

import { useEffect, useRef, useState } from "react";
import { AgentResult, DmConvo } from "@/lib/types";
import { MessageRow } from "./ChatWindow";

export function dmAvatar(id: DmConvo["id"]) {
  return id === "clawbot"
    ? { bg: "#f47b67", fg: "#000", label: "🐾" }
    : { bg: "#57f287", fg: "#000", label: "S" };
}

/**
 * Direct messages. Seadog007 is a read-only handler briefing;
 * Clawbot is a live AI chat (Level 3) once activated.
 */
export default function DMView({
  teamNumber,
  dm,
  onRefresh,
}: {
  teamNumber: string;
  dm: DmConvo;
  /** re-fetch team state after sending (DM messages come from state) */
  onRefresh: () => Promise<void> | void;
}) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const avatar = dmAvatar(dm.id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [dm.messages.length, sending]);

  async function send() {
    const content = input.trim();
    if (!content || sending || !dm.canWrite) return;
    setInput("");
    setSending(true);
    try {
      // Clawbot is the only writable DM — it is an AI agent
      const res = await fetch("/api/ai/clawbot", {
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
        <span className="text-xs text-muted">
          {dm.id === "clawbot" ? "· external bot" : "· your handler"}
        </span>
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
        {dm.messages.map((m) => (
          <MessageRow key={m.id} msg={m} />
        ))}
        {sending && (
          <div className="px-4 py-2 text-sm text-muted animate-fade-in">
            <span className="italic">{dm.name} is typing...</span>
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
              placeholder={`Message @${dm.name}`}
              className="flex-1 bg-transparent py-3 text-normal outline-none placeholder:text-muted/60"
            />
          </div>
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
