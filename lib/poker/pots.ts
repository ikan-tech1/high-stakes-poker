import type { Seat, SidePot } from "./types";

export type PotContribution = {
  seatId: number;
  totalContributed: number;
};

/** Build main + side pots from each seat's total contribution this hand. */
export function calculateSidePots(
  seats: Seat[],
  contributions: Map<number, number>
): SidePot[] {
  const active = seats.filter((s) => {
    const c = contributions.get(s.id) ?? 0;
    return c > 0;
  });

  if (active.length === 0) return [];

  const levels = [...new Set(active.map((s) => contributions.get(s.id) ?? 0))]
    .filter((n) => n > 0)
    .sort((a, b) => a - b);

  const pots: SidePot[] = [];
  let prev = 0;

  for (const level of levels) {
    const layer = level - prev;
    if (layer <= 0) continue;

    const eligible = active.filter((s) => (contributions.get(s.id) ?? 0) >= level);
    const amount = layer * eligible.length;
    if (amount > 0) {
      pots.push({
        amount,
        eligibleSeatIds: eligible.map((s) => s.id),
      });
    }
    prev = level;
  }

  return pots;
}

export function totalPotAmount(pots: SidePot[]): number {
  return pots.reduce((sum, p) => sum + p.amount, 0);
}
