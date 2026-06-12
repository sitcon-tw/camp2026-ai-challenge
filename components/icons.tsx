import { ClientChannel } from "@/lib/types";

export function HashIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.14 21.5l.85-4.5H5.5l.35-2h4.5l1.06-5.5H6.9l.35-2h4.53l.86-4.5h2l-.86 4.5h4.5l.86-4.5h2l-.86 4.5h4.5l-.35 2h-4.53L19.84 15h4.51l-.35 2h-4.54l-.85 4.5h-2l.85-4.5h-4.5l-.85 4.5h-2zM12.4 9.5L11.34 15h4.5l1.06-5.5h-4.5z" transform="scale(0.85) translate(-1,0)" />
    </svg>
  );
}

export function MegaphoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a1 1 0 0 0-1.6-.8L12 6H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h1l1.3 5.2A1 1 0 0 0 8.27 20H10a1 1 0 0 0 .97-1.24L9.9 14H12l5.4 3.8A1 1 0 0 0 19 17V3z" />
    </svg>
  );
}

export function RobotIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a1 1 0 0 1 1 1v2h4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h4V3a1 1 0 0 1 1-1zM7.5 10a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3h2zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-8 5.5h7a1 1 0 0 1 0 2h-7a1 1 0 0 1 0-2zM1 10h1.5v5H1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1zm22 0a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.5v-5H23z" transform="scale(0.92) translate(1,0)" />
    </svg>
  );
}

export function FlagIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 3a1 1 0 0 1 1 1v.3c1.9-.8 3.8-.8 6 .2 2.3 1 4 1 6 0a1 1 0 0 1 1.45.9v8.4a1 1 0 0 1-.55.9c-2.5 1.2-4.8 1.2-7.35.1-1.95-.9-3.5-.9-5.55-.1V21a1 1 0 0 1-2 0V4a1 1 0 0 1 1-1z" />
    </svg>
  );
}

export function LockIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 9V7A5 5 0 0 0 7 7v2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zM9 7a3 3 0 0 1 6 0v2H9V7z" />
    </svg>
  );
}

export function HomeIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.7 4.9A16.4 16.4 0 0 0 15.6 3.6l-.2.4a15 15 0 0 1 3.8 1.9 12.2 12.2 0 0 0-13.4 0 15 15 0 0 1 3.8-1.9l-.2-.4a16.4 16.4 0 0 0-4.1 1.3A17 17 0 0 0 2.4 16.2a16.6 16.6 0 0 0 5 2.5l.4-.6a10.6 10.6 0 0 1-1.9-.9l.5-.3a11.8 11.8 0 0 0 11.2 0l.5.3c-.6.4-1.2.7-1.9.9l.4.6a16.6 16.6 0 0 0 5-2.5A17 17 0 0 0 19.7 4.9zM8.7 14.2c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z" />
    </svg>
  );
}

/** icon for a channel: 🏁 flag > 🤖 ai > 📢 announcement > # text */
export function channelIcon(ch: Pick<ClientChannel, "type" | "flagLevel">) {
  if (ch.flagLevel) return FlagIcon;
  switch (ch.type) {
    case "ai":
      return RobotIcon;
    case "announcement":
      return MegaphoneIcon;
    default:
      return HashIcon;
  }
}
