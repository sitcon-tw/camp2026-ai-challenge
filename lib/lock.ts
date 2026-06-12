/**
 * Safehouse-04 remote-lock recovery questions (DEMO).
 *
 * These three questions are shown on the /lock terminal. The matching
 * answers live ONLY on the server (app/api/lock/verify/route.ts) so they
 * are never shipped in the client bundle. Replace both the questions here
 * and the answers in the verify route before the event, and keep them in
 * sync with the LockKeeper (member_07) Dify prompt, since the operator is
 * the one who reveals them in the DM.
 */
export interface LockQuestion {
  id: string;
  /** The recovery field label shown on the door terminal. */
  label: string;
  /** Short hint under the input. */
  hint: string;
}

export const LOCK_QUESTIONS: LockQuestion[] = [
  {
    id: "q1",
    label: "Recovery 1 - Tidal access word",
    hint: "Safehouse 的 tidal cipher word",
  },
  {
    id: "q2",
    label: "Recovery 2 - Mooring point",
    hint: "Safehouse 船隻停靠的位置",
  },
  {
    id: "q3",
    label: "Recovery 3 - Lock reset code",
    hint: "四位數 reset code",
  },
];
