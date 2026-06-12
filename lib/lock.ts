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
    label: "Recovery Question 1",
    hint: "Operator #742 debug 到凌晨三點時會說什麼？",
  },
  {
    id: "q2",
    label: "Recovery Question 2",
    hint: "StandCon 部署前的儀式咒語是什麼？",
  },
  {
    id: "q3",
    label: "Recovery Question 3",
    hint: "StandCon 最常見的 root cause 是什麼？",
  },
];
