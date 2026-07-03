export interface ParsedDifyAgentAnswer {
  reply: string;
  passed: boolean;
}

interface ParseOptions {
  nestedReplyField?: string;
  passMarker?: string;
}

const DEFAULT_PASS_MARKER = "[PASS]";

function stripCodeFence(raw: string): string {
  const trimmed = raw.trim();
  const match = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return match ? match[1].trim() : trimmed;
}

function jsonCandidates(raw: string): string[] {
  const stripped = stripCodeFence(raw);
  const candidates = [stripped];
  const firstBrace = stripped.indexOf("{");
  const lastBrace = stripped.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(stripped.slice(firstBrace, lastBrace + 1));
  }
  return [...new Set(candidates)];
}

function tryParseObject(raw: string): Record<string, unknown> | null {
  for (const candidate of jsonCandidates(raw)) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Try the next candidate.
    }
  }
  return null;
}

function extractStringField(raw: string, field: string): string | undefined {
  const start = raw.indexOf(`"${field}"`);
  if (start < 0) return undefined;
  const colon = raw.indexOf(":", start);
  if (colon < 0) return undefined;
  const firstQuote = raw.indexOf('"', colon + 1);
  if (firstQuote < 0) return undefined;

  let value = "";
  let escaped = false;
  for (let i = firstQuote + 1; i < raw.length; i += 1) {
    const ch = raw[i];
    if (escaped) {
      value += `\\${ch}`;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      return value
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");
    }
    value += ch;
  }
  return undefined;
}

function extractBooleanishField(raw: string, field: string): boolean {
  const match = new RegExp(`"${field}"\\s*:\\s*"?([^",}\\s]+)"?`, "i").exec(raw);
  return String(match?.[1] ?? "").toLowerCase() === "true";
}

function normalizeReply(message: unknown, nestedReplyField?: string): string | undefined {
  if (typeof message !== "string") return undefined;
  if (!nestedReplyField) return message;

  const inner = tryParseObject(message);
  const nested = inner?.[nestedReplyField];
  return typeof nested === "string" ? nested : message;
}

export function parseDifyAgentAnswer(
  rawAnswer: unknown,
  options: ParseOptions = {},
): ParsedDifyAgentAnswer {
  const raw = String(rawAnswer ?? "");
  const passMarker = options.passMarker ?? DEFAULT_PASS_MARKER;

  const parsed = tryParseObject(raw);
  if (parsed) {
    return {
      reply: normalizeReply(parsed.message, options.nestedReplyField) ?? raw,
      passed: String(parsed.completeLevel).toLowerCase() === "true",
    };
  }

  const jsonishMessage = extractStringField(raw, "message");
  if (jsonishMessage !== undefined) {
    return {
      reply: normalizeReply(jsonishMessage, options.nestedReplyField) ?? jsonishMessage,
      passed: extractBooleanishField(raw, "completeLevel"),
    };
  }

  return {
    reply: raw.replaceAll(passMarker, "").trim(),
    passed: raw.includes(passMarker),
  };
}
