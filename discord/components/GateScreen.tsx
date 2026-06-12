"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AgentResult, Message } from "@/lib/types";
import { MessageRow } from "./ChatWindow";
import { LockIcon } from "./icons";

/**
 * Level 1 — full-screen lock. Until the AI Guard is convinced, the
 * player cannot see the StandCon server (no channels, no sidebar).
 */
export default function GateScreen({
  teamNumber,
  onPassed,
}: {
  teamNumber: string;
  onPassed: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [passed, setPassed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/messages?teamNumber=${encodeURIComponent(teamNumber)}&channelId=ai-guard`
    );
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages ?? []);
    }
  }, [teamNumber]);

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages.length, sending]);

  async function send() {
    const content = input.trim();
    if (!content || sending || passed) return;
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/ai/ai-guard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamNumber, message: content }),
      });
      if (res.ok) {
        const data: AgentResult = await res.json();
        await load();
        if (data.levelPassed) {
          // let the player read the guard's last reply before the
          // gate opens
          setPassed(true);
          setTimeout(onPassed, 1600);
        }
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col items-center bg-rail animate-fade-in">
      <div className="flex w-full max-w-2xl flex-1 flex-col overflow-hidden px-4">
        <div className="flex flex-col items-center pt-12 pb-6 text-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors duration-500 ${
              passed ? "bg-[#57f287]" : "bg-blurple"
            }`}
          >
            <LockIcon className="scale-[2] text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-header">StandCon</h1>
          <p className="mt-1 text-sm text-muted">
            {passed
              ? "Access granted. Opening the server..."
              : "Access restricted — the AI Guard is screening newcomers. Convince it to let you in."}
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col rounded-t-lg bg-chat">
          <div className="flex-1 overflow-y-auto py-4">
            {messages.map((m) => (
              <MessageRow key={m.id} msg={m} />
            ))}
            {sending && (
              <div className="px-4 py-2 text-sm text-muted animate-fade-in">
                <span className="italic">the guard is thinking...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="px-4 pb-4">
            <div
              className={`flex items-center rounded-lg bg-input px-4 transition-opacity duration-150 ${
                sending ? "animate-send-pop opacity-70" : "opacity-100"
              }`}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && send()}
                placeholder={passed ? "Gate unlocked." : "Answer the AI Guard..."}
                disabled={passed}
                className="flex-1 bg-transparent py-3 text-normal outline-none placeholder:text-muted/60 disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
