import { getToCall } from "../poker/rules";
import type { ActionType, Card, GameConfig, LegalActions, Seat, Street } from "../poker/types";

function estimateStrength(hole: Card[], board: Card[]): number {
  if (hole.length < 2) return 0;

  if (board.length === 0) {
    const r1 = hole[0].rank;
    const r2 = hole[1].rank;
    const high = Math.max(r1, r2);
    const low = Math.min(r1, r2);
    const suited = hole[0].suit === hole[1].suit ? 0.08 : 0;
    const pair = r1 === r2 ? 0.35 + high / 20 : 0;
    return Math.min(0.95, high / 15 + low / 30 + suited + pair);
  }

  const all = [...hole, ...board];
  const ranks = all.map((c) => c.rank);
  const counts = new Map<number, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  const maxCount = Math.max(...counts.values());
  const pairCount = [...counts.values()].filter((c) => c === 2).length;

  let strength = 0.2;
  if (maxCount >= 4) strength = 0.98;
  else if (maxCount === 3) strength = 0.82;
  else if (pairCount >= 2) strength = 0.72;
  else if (maxCount === 2) strength = 0.45 + Math.max(...ranks) / 40;
  else strength = 0.15 + Math.max(...hole.map((c) => c.rank)) / 20;

  const suitCounts = new Map<string, number>();
  for (const c of all) suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
  if ([...suitCounts.values()].some((n) => n >= 4)) strength += 0.12;

  return Math.min(0.97, strength);
}

export function decideBotAction(
  seat: Seat,
  seats: Seat[],
  communityCards: Card[],
  street: Street,
  legal: LegalActions,
  config: GameConfig,
  seatIndex: number,
  pot: number
): { type: ActionType; amount?: number } {
  const strength = estimateStrength(seat.holeCards, communityCards);
  const toCall = getToCall(seat, seats);
  const bluff = Math.random() < 0.08;
  const potOdds = toCall / (pot + toCall + 1);

  if (street === "preflop") {
    const late = seatIndex >= seats.length - 2;
    const threshold = late ? 0.32 : 0.42;

    if (strength < threshold - 0.12) {
      if (toCall > 0 && legal.canFold) return { type: "fold" };
      if (legal.canCheck) return { type: "check" };
      return { type: "fold" };
    }
    if (strength > 0.68 && legal.canRaise) {
      return {
        type: "raise",
        amount: Math.min(legal.maxRaise, legal.minRaise + config.bigBlind * 2),
      };
    }
    if (strength > threshold) {
      if (legal.canCall) return { type: "call" };
      if (legal.canCheck) return { type: "check" };
    }
    if (toCall > 0 && legal.canFold) return { type: "fold" };
    if (legal.canCheck) return { type: "check" };
    return { type: "call" };
  }

  if (strength > 0.78 && legal.canRaise) {
    return {
      type: "raise",
      amount: Math.min(legal.maxRaise, legal.minRaise + Math.floor(pot * 0.55)),
    };
  }

  if (bluff && legal.canRaise && toCall < seat.stack * 0.15) {
    return { type: "raise", amount: legal.minRaise };
  }

  if (strength < 0.25 && toCall > 0) {
    if (toCall > seat.stack * 0.3 && legal.canFold) return { type: "fold" };
    if (potOdds < strength && legal.canCall) return { type: "call" };
    if (legal.canFold) return { type: "fold" };
  }

  if (strength > 0.55) {
    if (legal.canRaise && toCall === 0) {
      return {
        type: "raise",
        amount: Math.min(legal.maxRaise, legal.minRaise + Math.floor(pot * 0.5)),
      };
    }
    if (legal.canCall) return { type: "call" };
  }

  if (strength > 0.38 && legal.canCall && toCall <= seat.stack * 0.2) {
    return { type: "call" };
  }

  if (legal.canCheck) return { type: "check" };
  if (legal.canCall && toCall <= seat.stack * 0.15) return { type: "call" };
  if (legal.canFold) return { type: "fold" };
  if (legal.canAllIn) return { type: "all_in" };

  return { type: "check" };
}

export function botThinkDelayMs(): number {
  return 400 + Math.floor(Math.random() * 500);
}
