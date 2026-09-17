/** Structural teaching policies. Recurrent state and layer schedules are not pair masks. */
export type PairAttentionMode = "causal" | "sliding" | "sparse";
export const teachingWindow = 4;

export function canReadPosition(mode: PairAttentionMode, query: number, key: number): boolean {
  if (key < 0 || query < 0 || key > query) return false;
  if (mode === "causal") return true;
  if (mode === "sliding") return query - key < teachingWindow;
  // Directly addressed, bounded four-key example; no learned scoring or search.
  return key === 0 || key === query || key === query - 1 || key === Math.floor(query / 2);
}
