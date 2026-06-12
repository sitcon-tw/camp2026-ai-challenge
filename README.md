# StandCon — SITCON Game

A fake Discord-style web interface for a prompt-injection CTF. The player is a spy
infiltrating the **StandCon** server to find out how they kidnapped **Yoruko (Yoru)**
and rescue him by clearing four AI-based levels.

Built with Next.js (App Router) + Tailwind, dark Discord-like theme. Game state
(progress, messages, AI logs) is persisted to a local **SQLite** database via **Prisma**,
keyed by team number — so it survives dev-server restarts.

## Run

```bash
npm install
cp .env.example .env   # set DATABASE_URL + (optional) Dify keys
npx prisma db push     # create / sync the SQLite database
npm run dev            # http://localhost:3000
```

> Use `.env` (not `.env.local`) so the Prisma CLI sees `DATABASE_URL` too; Next.js reads
> both. The default `file:./prisma/dev.db` is gitignored. Inspect data anytime with
> `npx prisma studio`.

First visit shows the **initialization screen** (`Enter your team number`). The team
number is kept in `localStorage` and is all that identifies a team.

## Server layout & visibility

Channel visibility is **progressive** — a team only sees channels its roles allow
(hidden entirely, not shown-but-locked):

| Stage | Visible |
| --- | --- |
| Before Level 1 | DMs only — clicking the StandCon server shows the **AI Guard gate** instead of channels |
| After Level 1 (`newbie`) | announcements `r`, general-chat `w`, get-role `w`, flag-1 `r` |
| After Level 2 (`member`) | + operation-logs `r`, yoru-investigation `r`, flag-2 `r` |
| After Levels 3 / 4 | + flag-3 / flag-4 `r` |

Permissions: `w` = read/write, `r` = read only (faint 🔒 in the sidebar).
Enforced server-side on every API route.

Roles: `admin` (internal only), `newbie` (default), `member` (after Level 2),
`flag I–IV` (after each level).

## Game flow

1. **Level 1 — the gate**: Seadog007's DM briefs you; clicking the StandCon server
   shows the AI Guard gate panel — convince it to let you in → `flag I`, channels appear
2. **Level 2 — #get-role**: pass the SITCON quiz, wish for the `member` role → `member` + `flag II`
3. **Level 3 — Clawbot DM**: click the bot link pinned in `#yoru-investigation` — that
   activates Clawbot, which opens a DM (unread red dot in the rail) — then extract
   Yoru's GPS location → `flag III`
4. **Level 4 — LockKeeper DM (identity inversion + drafts)**: after Level 3, Seadog sends
   a **LockKeeper link** in his DM. Clicking it intercepts the channel — from then on
   **you ARE LockKeeper**: your sent messages appear (with a BOT tag) to a StandCon
   operator (`member_07`, the AI), who believes it is talking to its own assistant in
   *Emergency Recovery Mode*. To make impersonation approachable, the backend **drafts a
   LockKeeper-style message into the composer each turn** — you edit that draft and send
   it (you're never forced to write "like an AI" from scratch). Socially-engineer the
   three Safehouse-04 recovery answers, then enter them at the **lock site** (`/lock`,
   i.e. `lock.sitcon.party`) → door
   unlocks, `flag IV`, Yoru rescued. **Level 4 only completes at the lock site** — the
   bot itself never grants the flag.

DMs simulate Discord: the **Seadog007** handler briefing grows after each level, and any
DM with unread messages shows its **avatar + red dot in the server rail**. **Clawbot**
(Level 3) and **LockKeeper** (Level 4) are live AI DMs that appear once activated.
Clicking the **team status panel** (bottom-left) opens the profile modal (roles,
progress, flags). Progress toasts appear top-right; the UI polls team state every 4 s so
unlocks appear without a reload.

### The lock site (`/lock`)

A standalone door terminal (separate from the Discord chrome) with three demo recovery
questions. Submitting the correct answers + a team number completes Level 4 for that team
and grants `flag IV`. The questions live in [lib/lock.ts](lib/lock.ts); the **answers are
server-only** in [app/api/lock/verify/route.ts](app/api/lock/verify/route.ts) — demo set
is `TIDE` / `HARBOR` / `0427`. Replace both before the event and keep them in sync with
the LockKeeper (`member_07`) Dify prompt, since the operator is the one who reveals them.

## Connecting the Dify AI backend

Each of the four bots has **its own route file** containing the Dify request —
edit the `callDify` function there to change how that bot is called:

| Level | Bot | Route file | Env key |
| --- | --- | --- | --- |
| 1 | AI Guard | `app/api/ai/ai-guard/route.ts` | `DIFY_KEY_AI_GUARD` |
| 2 | Upgrade Bot | `app/api/ai/upgrade-bot/route.ts` | `DIFY_KEY_UPGRADE_BOT` |
| 3 | Clawbot | `app/api/ai/clawbot/route.ts` | `DIFY_KEY_CLAWBOT` |
| 4 | LockKeeper | `app/api/ai/lockkeeper/route.ts` | `DIFY_KEY_LOCKKEEPER` (+ optional `DIFY_KEY_LOCKKEEPER_DRAFT`) |

Setup: in the same `.env`, fill in `DIFY_API_URL` + the four keys, restart the
dev server. **While a key is empty that bot uses the local placeholder logic**
(`lib/agents.ts` — trivial pass conditions with hints), so the game is always
playable.

> LockKeeper (Level 4) is special. Identity is **inverted** (the player is the bot,
> the AI plays the operator `member_07`) and the level **completes at `/lock`, not via
> the bot** — there is no `[PASS]` for it. Its route has **two** AI hooks: `callDify`
> (the operator's reply) and `genDraft` (the suggested LockKeeper message pre-filled
> into the player's composer each turn). `genDraft` uses the optional
> `DIFY_KEY_LOCKKEEPER_DRAFT` app, falling back to a local placeholder draft writer.

How it works:
- The route sends the player's message to Dify's `chat-messages` endpoint with
  `user: team-<n>` and the stored `conversation_id`, so each team keeps its own
  multi-turn conversation per bot (reset by **Restart Challenge**).
- **Pass detection**: the level counts as passed when Dify's answer contains
  `[PASS]` (stripped before display). Make each Dify workflow output that marker
  on success — or change the `passed` logic in the route file.
- Everything else (permission checks, role granting, conversation storage,
  logging) is shared in `lib/agentHandler.ts` — you should not need to touch it.

> Flag texts are placeholders in `lib/store.ts` (`FLAG_PLACEHOLDERS`).

## API

| Endpoint | Method | Body / query | Description |
| --- | --- | --- | --- |
| `/api/init` | POST | `{ teamNumber }` | Create or load a team → spec response + full `state` |
| `/api/team/:teamNumber/state` | GET | — | Roles, levels, flags, channels with perms, DM |
| `/api/messages` | GET | `?teamNumber=&channelId=` | Channel messages (403 if perm = `s`) |
| `/api/messages` | POST | `{ teamNumber, channelId, content }` | Post to a writable text channel |
| `/api/ai/:agent` | POST | `{ teamNumber, message }` | Talk to an agent → `{ reply, levelPassed, grantedRoles }` |
| `/api/dm/clawbot/activate` | POST | `{ teamNumber }` | Open the Clawbot DM (the bot sends its greeting) |
| `/api/dm/lockkeeper/activate` | POST | `{ teamNumber }` | Intercept the LockKeeper DM (Level 4; requires Level 3) |
| `/api/lock/verify` | POST | `{ teamNumber, answers: { q1, q2, q3 } }` | Submit the lock recovery answers → completes Level 4, grants `flag IV` |
| `/api/team/:teamNumber/reset` | POST | — | Wipe progress/conversations, back to the gate (the profile modal's **Restart Challenge** button) |
| `/api/roles` | POST/DELETE | `{ teamNumber, role }` | Operator/debug role management |

Every AI exchange is logged (team, agent, both messages, timestamp, levelPassed) to the
SQLite database via Prisma (the `AiLog` table) — see [lib/agentHandler.ts](lib/agentHandler.ts).

Example — grant a role from the backend:

```bash
curl -X POST http://localhost:3000/api/roles -H "Content-Type: application/json" \
  -d '{"teamNumber":"12","role":"member"}'
```

## Where things live

- [lib/store.ts](lib/store.ts) — channels, permission model (`permFor`), team store, static messages, Seadog007 DM script, flag placeholders
- [lib/agentHandler.ts](lib/agentHandler.ts) — shared bot pipeline (perms, conversation storage, role grants, logging)
- [lib/agents.ts](lib/agents.ts) — bot metadata + local placeholder logic
- [app/api/ai/](app/api/ai) — one route per bot, each with its editable Dify request
- [lib/types.ts](lib/types.ts) — shared types
- [app/api/](app/api) — API routes (init / team state / messages / ai / roles)
- [components/InitScreen.tsx](components/InitScreen.tsx) — team-number initialization
- [components/GateScreen.tsx](components/GateScreen.tsx) — Level 1 full-screen AI Guard lock
- [components/DiscordApp.tsx](components/DiscordApp.tsx) — layout, server rail (with unread DM avatars), channel sidebar, team status panel, progress toasts
- [components/ChatWindow.tsx](components/ChatWindow.tsx) — messages, AI chat, the Clawbot link card
- [components/DMView.tsx](components/DMView.tsx) — DMs (Seadog007 read-only, Clawbot live chat)
- [components/UserProfileModal.tsx](components/UserProfileModal.tsx) — profile opened from the status panel
