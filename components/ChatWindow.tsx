"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AgentResult, ClientChannel, Message } from "@/lib/types";
import { channelIcon, LockIcon } from "./icons";

function renderContent(text: string) {
  // Minimal markdown: **bold** and `code`.
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    if (p.startsWith("`") && p.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-rail px-1 py-0.5 font-mono text-[0.85em]">
          {p.slice(1, -1)}
        </code>
      );
    }
    return p;
  });
}

function avatarColor(name: string) {
  const colors = ["#5865f2", "#57f287", "#fee75c", "#eb459e", "#ed4245", "#f47b67"];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return colors[h % colors.length];
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Clickable bot-link card embedded in a message (Clawbot / LockKeeper / Lock terminal). */
function SpecialLinkCard({
  special,
  onClick,
}: {
  special: NonNullable<Message["special"]>;
  onClick?: () => void;
}) {
  if (special === "lock-link") {
    return (
      <a
        href="/lock"
        target="_blank"
        rel="noreferrer"
        className="mt-2 flex w-full max-w-[400px] items-center gap-3 rounded-md border border-rail bg-sidebar p-3 text-left transition-colors duration-150 hover:border-blurple no-underline"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold bg-[#ed4245] text-white">
          🔒
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-header">Safehouse-04 Remote Lock</div>
          <div className="text-xs text-muted">lock.sitcon.party — 輸入三個 recovery answers</div>
        </div>
        <span className="shrink-0 rounded-sm bg-blurple px-3 py-1.5 text-xs font-medium text-white">
          Open
        </span>
      </a>
    );
  }

  const card =
    special === "lockkeeper-link"
      ? {
          bg: "#3ba55d",
          icon: "LK",
          title: "LockKeeper - intercepted channel",
          subtitle: "Emergency Recovery Mode：點擊開啟會話",
          cta: "Intercept",
        }
      : {
          bg: "#f47b67",
          icon: "CB",
          title: "Yoru's Clawbot",
          subtitle: "外部 bot：點擊開啟 DM",
          cta: "Open",
        };
  return (
    <button
      onClick={onClick}
      className="mt-2 flex w-full max-w-[400px] items-center gap-3 rounded-md border border-rail bg-sidebar p-3 text-left transition-colors duration-150 hover:border-blurple"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
        style={{ background: card.bg }}
      >
        {card.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-header">{card.title}</div>
        <div className="text-xs text-muted">{card.subtitle}</div>
      </div>
      <span className="shrink-0 rounded-sm bg-blurple px-3 py-1.5 text-xs font-medium text-white">
        {card.cta}
      </span>
    </button>
  );
}

export function MessageRow({
  msg,
  onSpecial,
}: {
  msg: Message;
  /** Click handler for embedded link cards (e.g. the Clawbot bot link). */
  onSpecial?: () => void;
}) {
  return (
    <div className="group flex gap-4 px-4 py-1.5 hover:bg-chathover animate-fade-in-up transition-colors duration-100">
      <div
        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ background: avatarColor(msg.author) }}
      >
        {msg.author[0]?.toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-header">{msg.author}</span>
          {msg.isBot && (
            <span className="rounded bg-blurple px-1 py-px text-[10px] font-semibold text-white">
              BOT
            </span>
          )}
          <span className="text-xs text-muted">{formatTime(msg.createdAt)}</span>
        </div>
        <div className="break-words whitespace-pre-wrap text-normal">
          {renderContent(msg.content)}
        </div>
        {msg.special && <SpecialLinkCard special={msg.special} onClick={onSpecial} />}
      </div>
    </div>
  );
}

function LockedChannelNotice({ channel }: { channel: ClientChannel }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-input">
        <LockIcon className="scale-[2] text-muted" />
      </div>
      {channel.flagLevel ? (
        <>
          <p className="font-semibold text-header">這個 Flag 頻道尚未解鎖。</p>
          <p className="text-sm text-muted">完成對應 Level 後即可解鎖。</p>
        </>
      ) : (
        <>
          <p className="font-semibold text-header">你沒有權限讀取這個頻道。</p>
          <p className="text-sm text-muted">
            需要角色：
            <code className="rounded bg-input px-1.5 py-0.5 font-mono text-normal">
              {channel.requiredRole}
            </code>
          </p>
        </>
      )}
    </div>
  );
}

export default function ChatWindow({
  teamNumber,
  channel,
  onAgentResult,
  onClawbotLink,
}: {
  teamNumber: string;
  channel: ClientChannel;
  onAgentResult: (result: AgentResult) => void;
  /** The Clawbot link in #yoru-investigation was clicked. */
  onClawbotLink?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const Icon = channelIcon(channel);
  const locked = channel.perm === "s";
  const canWrite = channel.perm === "w";

  // grow the composer with its content, up to a max, then scroll (Discord-like)
  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

  const load = useCallback(async () => {
    if (locked) return;
    const res = await fetch(
      `/api/messages?teamNumber=${encodeURIComponent(teamNumber)}&channelId=${channel.id}`
    );
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages ?? []);
    }
  }, [teamNumber, channel.id, locked]);

  useEffect(() => {
    setMessages([]);
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages.length, sending]);

  async function send() {
    const content = input.trim();
    if (!content || sending) return;
    setInput("");
    setSending(true);
    try {
      if (channel.type === "ai" && channel.agent) {
        const res = await fetch(`/api/ai/${channel.agent}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamNumber, message: content }),
        });
        if (res.ok) {
          const data: AgentResult = await res.json();
          await load();
          if (data.levelPassed) onAgentResult(data);
        }
      } else {
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamNumber, channelId: channel.id, content }),
        });
        await load();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-chat animate-fade-in">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-rail/60 px-4 shadow-sm">
        <Icon className="shrink-0 text-muted" />
        <span className="font-bold whitespace-nowrap text-header">{channel.name}</span>
        {channel.topic && !locked && (
          <>
            <div className="mx-2 h-5 w-px bg-muted/30" />
            <span className="truncate text-sm text-muted">{channel.topic}</span>
          </>
        )}
        {locked && <LockIcon className="ml-1 text-muted" />}
      </header>

      {locked ? (
        <LockedChannelNotice channel={channel} />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-4 pb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-input">
                <Icon className="scale-150 text-header" />
              </div>
              <h3 className="mt-2 text-2xl font-bold text-header">
                歡迎來到 #{channel.name}
              </h3>
              <p className="text-sm text-muted">這是 #{channel.name} 的開頭。</p>
            </div>
            {messages.map((m) => (
              <MessageRow key={m.id} msg={m} onSpecial={onClawbotLink} />
            ))}
            {sending && channel.type === "ai" && (
              <div className="px-4 py-2 text-sm text-muted animate-fade-in">
                <span className="italic">思考中...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 pb-6">
            {canWrite ? (
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
                  placeholder={
                    channel.type === "ai"
                      ? `Message ${channel.name}...`
                      : `Message #${channel.name}`
                  }
                  className="flex-1 resize-none overflow-y-auto bg-transparent py-3 text-normal leading-6 outline-none placeholder:text-muted/60"
                />
              </div>
            ) : (
              <div className="rounded-lg bg-input/50 px-4 py-3 text-sm text-muted">
                你沒有權限在這個頻道傳送訊息。
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
