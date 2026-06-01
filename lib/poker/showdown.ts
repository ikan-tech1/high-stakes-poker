import { Hand } from "pokersolver";
import { cardToString } from "./deck";
import type { Card, Seat, SidePot, WinnerInfo } from "./types";

function toSolverCard(card: Card): string {
  return cardToString(card);
}

export function evaluateHand(holeCards: Card[], communityCards: Card[]): {
  name: string;
  rank: number;
} {
  const cards = [...holeCards, ...communityCards].map(toSolverCard);
  if (cards.length < 5) {
    return { name: "Incomplete", rank: 0 };
  }
  const hand = Hand.solve(cards);
  return { name: hand.name, rank: hand.rank };
}

export function resolveShowdownWinners(
  seats: Seat[],
  communityCards: Card[],
  sidePots: SidePot[]
): WinnerInfo[] {
  const winners: WinnerInfo[] = [];
  const active = seats.filter((s) => !s.folded && s.holeCards.length === 2);

  for (const pot of sidePots) {
    const eligible = active.filter((s) => pot.eligibleSeatIds.includes(s.id));
    if (eligible.length === 0) continue;

    const ranked = eligible.map((seat) => {
      const evalResult = evaluateHand(seat.holeCards, communityCards);
      const solverCards = [...seat.holeCards, ...communityCards].map(toSolverCard);
      const hand = Hand.solve(solverCards);
      return { seat, hand, evalResult };
    });

    ranked.sort((a, b) => b.hand.rank - a.hand.rank);
    const bestRank = ranked[0].hand.rank;
    const potWinners = ranked.filter((r) => r.hand.rank === bestRank);

    const share = Math.floor(pot.amount / potWinners.length);
    let remainder = pot.amount - share * potWinners.length;

    for (const w of potWinners) {
      const extra = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder--;
      winners.push({
        seatId: w.seat.id,
        seatName: w.seat.name,
        amount: share + extra,
        handName: w.evalResult.name,
        cards: w.seat.holeCards,
      });
    }
  }

  return winners;
}

export function mergeWinnerPayouts(winners: WinnerInfo[]): WinnerInfo[] {
  const map = new Map<number, WinnerInfo>();
  for (const w of winners) {
    const existing = map.get(w.seatId);
    if (existing) {
      existing.amount += w.amount;
    } else {
      map.set(w.seatId, { ...w });
    }
  }
  return [...map.values()];
}
