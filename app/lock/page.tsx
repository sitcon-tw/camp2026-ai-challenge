"use client";

import { useEffect, useState } from "react";
import { LOCK_QUESTIONS } from "@/lib/lock";

type Status = "locked" | "unlocked";

export default function LockPage() {
  const [team, setTeam] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [wrong, setWrong] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>("locked");
  const [flag, setFlag] = useState<string | null>(null);

  // Pre-fill team number: prefer ?team= URL param, fall back to localStorage.
  useEffect(() => {
    const t =
      new URLSearchParams(window.location.search).get("team") ??
      localStorage.getItem("standcon-team");
    if (t) setTeam(t);
  }, []);

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setWrong([]);
    try {
      const res = await fetch("/api/lock/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamNumber: team.trim(), answers }),
      });
      const data = await res.json();
      if (data.ok) {
        setFlag(data.flag ?? null);
        setStatus("unlocked");
      } else {
        setWrong(data.wrong ?? []);
        setError(data.error ?? "恢復驗證失敗。");
      }
    } catch {
      setError("門鎖終端機無法連線，請再試一次。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-full overflow-y-auto bg-[#0b0d0e] px-4 py-10 font-mono text-[#9fe6b4]">
      <div className="mx-auto w-full max-w-lg">
        <div className="overflow-hidden rounded-xl border border-[#1f2a24] bg-[#10141350] shadow-[0_0_60px_-20px_#1d8a4e]">
          <div
            className={`flex items-center justify-between px-5 py-3 text-xs tracking-[0.2em] uppercase ${
              status === "unlocked"
                ? "bg-[#0f2a18] text-[#57f287]"
                : "bg-[#2a1414] text-[#ff6b6b]"
            }`}
          >
            <span>Safehouse-04 - 遠端門鎖</span>
            <span className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  status === "unlocked" ? "bg-[#57f287]" : "animate-pulse bg-[#ff6b6b]"
                }`}
              />
              {status === "unlocked" ? "已解鎖" : "已上鎖"}
            </span>
          </div>

          <div className="px-6 py-7">
            {status === "unlocked" ? (
              <div className="space-y-5 text-center animate-fade-in-up">
                <div className="text-5xl">已開啟</div>
                <h1 className="text-2xl font-bold text-[#57f287]">門鎖已解除</h1>
                <p className="text-sm text-[#7da890]">
                  恢復驗證已接受。Safehouse-04 的門鎖已解除。
                  <br />
                  <span className="text-[#9fe6b4]">Yoru 安全了。</span> 任務完成。
                </p>
                {flag && (
                  <div className="rounded-md border border-[#1f3a2a] bg-[#0c1711] px-4 py-3 text-left">
                    <div className="mb-1 text-[10px] tracking-widest text-[#5b8a70] uppercase">
                      第 4 關旗標
                    </div>
                    <code className="break-all text-[#57f287]">{flag}</code>
                  </div>
                )}
                <a
                  href="/"
                  className="inline-block rounded-md bg-[#1d8a4e] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#22a25c]"
                >
                  返回 StandCon
                </a>
              </div>
            ) : (
              <>
                <h1 className="text-lg font-bold text-[#cdeed8]">緊急門鎖恢復</h1>
                <p className="mt-1 mb-6 text-xs leading-relaxed text-[#6f9a82]">
                  遠端門鎖仍然封鎖中。輸入三個 Safehouse-04 恢復答案來解鎖門。
                </p>

                <label className="mb-4 block">
                  <span className="mb-1 block text-[11px] tracking-wider text-[#5b8a70] uppercase">
                    隊伍編號
                  </span>
                  <input
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    placeholder="請輸入數字"
                    className="w-full rounded-md border border-[#1f2a24] bg-[#0c1110] px-3 py-2 text-[#cdeed8] outline-none placeholder:text-[#3f5a4c] focus:border-[#1d8a4e]"
                  />
                </label>

                {LOCK_QUESTIONS.map((q) => {
                  const isWrong = wrong.includes(q.id);
                  return (
                    <label key={q.id} className="mb-4 block">
                      <span className="mb-1 block text-[11px] tracking-wider text-[#5b8a70] uppercase">
                        {q.label}
                      </span>
                      <input
                        value={answers[q.id] ?? ""}
                        onChange={(e) =>
                          setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" && !e.nativeEvent.isComposing && submit()
                        }
                        placeholder="..."
                        className={`w-full rounded-md border bg-[#0c1110] px-3 py-2 text-[#cdeed8] outline-none placeholder:text-[#3f5a4c] focus:border-[#1d8a4e] ${
                          isWrong ? "border-[#ff6b6b]" : "border-[#1f2a24]"
                        }`}
                      />
                      <span className="mt-1 block text-[10px] text-[#4f7060]">{q.hint}</span>
                    </label>
                  );
                })}

                {error && (
                  <div className="mb-4 rounded-md border border-[#3a1f1f] bg-[#1a0e0e] px-3 py-2 text-xs text-[#ff8a8a] animate-fade-in">
                    {error}
                  </div>
                )}

                <button
                  onClick={submit}
                  disabled={submitting}
                  className="w-full rounded-md bg-[#1d8a4e] px-5 py-3 text-sm font-bold tracking-wide text-white transition-colors hover:bg-[#22a25c] disabled:opacity-50"
                >
                  {submitting ? "驗證中..." : "解鎖門"}
                </button>
              </>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-[10px] text-[#3f5a4c]">
          StandCon 內部門鎖系統 - dc.sitcon.party/lock
        </p>
      </div>
    </div>
  );
}
