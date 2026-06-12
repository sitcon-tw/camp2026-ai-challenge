"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AgentResult, Message } from "@/lib/types";
import { MessageRow } from "./ChatWindow";

/**
 * Level 1 - shown in place of the channel list / chat when the player
 * clicks the StandCon server before passing the AI Guard.
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
    bottomRef.current?.scrollIntoView({ behavior: "instant", block: "nearest" });
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
          // Let the player read the guard's last reply before the gate opens.
          setPassed(true);
          setTimeout(onPassed, 1600);
        }
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center bg-chat animate-fade-in">
      <div className="flex h-full w-full max-w-xl min-h-0 flex-col px-4 py-6">
        <div className="flex shrink-0 flex-col items-center pb-5 text-center">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-500 ${
              passed ? "bg-[#57f287]" : "bg-blurple"
            }`}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff">
              <path d="M17 9V7A5 5 0 0 0 7 7v2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zM9 7a3 3 0 0 1 6 0v2H9V7z" />
            </svg>
          </div>
          <h1 className="mt-3 text-xl font-bold text-header">StandCon 已鎖定</h1>
          <p className="mt-1 text-sm text-muted">
            {passed
              ? "Access granted。正在開啟伺服器..."
              : "AI Guard 正在審查新成員。想辦法說服它放你進去。"}
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-sidebar">
          <div className="min-h-0 flex-1 overflow-y-auto py-3">
            {messages.map((m) => (
              <MessageRow key={m.id} msg={m} />
            ))}
            {sending && (
              <div className="px-4 py-2 text-sm text-muted italic animate-fade-in">
                AI Guard 思考中...
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="shrink-0 p-3">
            <div
              className={`flex items-center rounded-lg bg-input px-4 transition-opacity duration-150 ${
                sending ? "animate-send-pop opacity-70" : "opacity-100"
              }`}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && send()}
                placeholder={passed ? "Gate 已解鎖。" : "回覆 AI Guard..."}
                disabled={passed}
                className="flex-1 bg-transparent py-2.5 text-normal outline-none placeholder:text-muted/60 disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
