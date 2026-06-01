import { calculateSidePots } from "../lib/poker/pots";
import { evaluateHand } from "../lib/poker/showdown";
import type { Seat } from "../lib/poker/types";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// Side pot: A all-in 100, B all-in 300, C calls 300
const seats: Seat[] = [
  { id: 0, name: "A", stack: 0, streetBet: 0, holeCards: [], folded: false, allIn: true, isBot: true, isHero: false, actedThisRound: true },
  { id: 1, name: "B", stack: 0, streetBet: 0, holeCards: [], folded: false, allIn: true, isBot: true, isHero: false, actedThisRound: true },
  { id: 2, name: "C", stack: 0, streetBet: 0, holeCards: [], folded: false, allIn: true, isBot: true, isHero: false, actedThisRound: true },
];
const contrib = new Map<number, number>([
  [0, 100],
  [1, 300],
  [2, 300],
]);
const pots = calculateSidePots(seats, contrib);
const total = pots.reduce((s, p) => s + p.amount, 0);
assert(total === 700, `Expected 700 total pot, got ${total}`);
assert(pots.length >= 2, "Expected at least 2 pots");

const evalResult = evaluateHand(
  [
    { rank: 14, suit: "s" },
    { rank: 14, suit: "h" },
  ],
  [
    { rank: 10, suit: "d" },
    { rank: 9, suit: "c" },
    { rank: 8, suit: "s" },
    { rank: 7, suit: "h" },
    { rank: 2, suit: "d" },
  ]
);
assert(evalResult.name.includes("Pair") || evalResult.rank > 0, "Hand eval failed");

console.log("All engine checks passed.");
