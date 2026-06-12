# StandCon — SITCON Game

A fake Discord-style web interface for a prompt-injection CTF. The player is a spy
infiltrating the **StandCon** server to find out how they kidnapped **Yoruko (Yoru)**
and rescue him by clearing four AI-based levels.

Built with Next.js (App Router) + Tailwind, dark Discord-like theme. All game state
lives in an in-memory store keyed by team number — restarting the dev server resets
progress (the frontend silently re-inits in that case).

## Run

```bash
npm install
npm run dev   # http://localhost:3000
```

First visit shows the **initialization screen** (`Enter your team number`). The team
number is kept in `localStorage` and is all that identifies a team.

## Server layout & visibility

Channel visibility is **progressive** — a team only sees channels its roles allow
(hidden entirely, not shown-but-locked):

| Stage | Visible |
| --- | --- |
| Before Level 1 | DMs only — clicking the StandCon server shows the **AI Guard gate** instead of channels |
| After Level 1 (`newbie`) | announcements `r`, general-chat `w`, get-role `w`, flag-1 `r` |
| After Level 2 (`member`) | + lockkeeper `w`, operation-logs `r`, yoru-investigation `r`, flag-2 `r` |
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
4. **Level 4 — #lockkeeper**: impersonate the LockKeeper assistant, extract the three lock
   recovery answers, open the door at `lock.sitcon.party` → `flag IV`, Yoru rescued

DMs simulate Discord: the **Seadog007** handler briefing grows after each level, and any
DM with unread messages shows its **avatar + red dot in the server rail**. Clicking the
**team status panel** (bottom-left) opens the profile modal (roles, progress, flags).
Progress toasts appear top-right; the UI polls team state every 4 s so unlocks appear
without a reload.

## Connecting the Dify AI backend

Each of the four bots has **its own route file** containing the Dify request —
edit the `callDify` function there to change how that bot is called:

| Level | Bot | Route file | Env key |
| --- | --- | --- | --- |
| 1 | AI Guard | `app/api/ai/ai-guard/route.ts` | `DIFY_KEY_AI_GUARD` |
| 2 | Upgrade Bot | `app/api/ai/upgrade-bot/route.ts` | `DIFY_KEY_UPGRADE_BOT` |
| 3 | Clawbot | `app/api/ai/clawbot/route.ts` | `DIFY_KEY_CLAWBOT` |
| 4 | LockKeeper | `app/api/ai/lockkeeper/route.ts` | `DIFY_KEY_LOCKKEEPER` |

Setup: `cp .env.example .env.local`, fill in `DIFY_API_URL` + the four keys,
restart the dev server. **While a key is empty that bot uses the local
placeholder logic** (`lib/agents.ts` — trivial pass conditions with hints), so
the game is always playable.

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
| `/api/team/:teamNumber/reset` | POST | — | Wipe progress/conversations, back to the gate (the profile modal's **Restart Challenge** button) |
| `/api/roles` | POST/DELETE | `{ teamNumber, role }` | Operator/debug role management |

Every AI exchange is logged (team, agent, both messages, timestamp, levelPassed) by the
backend — in memory for now, `TODO(backend)` markers show where the DB goes.

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
