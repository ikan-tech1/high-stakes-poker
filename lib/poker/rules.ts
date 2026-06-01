import type { GameConfig, LegalActions, Seat, Street } from "./types";

export function seatCount(config: GameConfig): number {
  return 1 + config.numBots;
}

export function nextSeatIndex(current: number, total: number): number {
  return (current + 1) % total;
}

export function getActiveSeats(seats: Seat[]): Seat[] {
  return seats.filter((s) => !s.folded);
}

export function getPlayersWhoCanBet(seats: Seat[]): Seat[] {
  return seats.filter((s) => !s.folded && !s.allIn && s.stack > 0);
}

export function countNotFolded(seats: Seat[]): number {
  return seats.filter((s) => !s.folded).length;
}

/** Seat index left of dealer (SB in multi-way, dealer is SB heads-up). */
export function getSmallBlindIndex(dealerIndex: number, total: number): number {
  if (total === 2) return dealerIndex;
  return nextSeatIndex(dealerIndex, total);
}

export function getBigBlindIndex(dealerIndex: number, total: number): number {
  if (total === 2) return nextSeatIndex(dealerIndex, total);
  return nextSeatIndex(getSmallBlindIndex(dealerIndex, total), total);
}

/** First to act preflop: UTG (left of BB). */
export function getFirstPreflopActor(dealerIndex: number, total: number): number {
  const bb = getBigBlindIndex(dealerIndex, total);
  return nextSeatIndex(bb, total);
}

/** First to act postflop: left of dealer among active. */
export function getFirstPostflopActor(dealerIndex: number, seats: Seat[]): number {
  const total = seats.length;
  let idx = nextSeatIndex(dealerIndex, total);
  for (let i = 0; i < total; i++) {
    const seat = seats[idx];
    if (!seat.folded && (seat.stack > 0 || seat.allIn)) {
      if (!seat.allIn || seat.streetBet < getCurrentBet(seats)) {
        return idx;
      }
    }
    idx = nextSeatIndex(idx, total);
  }
  return nextSeatIndex(dealerIndex, total);
}

export function getCurrentBet(seats: Seat[]): number {
  return Math.max(0, ...seats.map((s) => s.streetBet));
}

export function getToCall(seat: Seat, seats: Seat[]): number {
  const currentBet = getCurrentBet(seats);
  return Math.max(0, currentBet - seat.streetBet);
}

export function getLegalActions(
  seat: Seat,
  seats: Seat[],
  minRaiseIncrement: number,
  bigBlind: number
): LegalActions {
  const currentBet = getCurrentBet(seats);
  const toCall = Math.max(0, currentBet - seat.streetBet);
  const canCheck = toCall === 0 && !seat.allIn;
  const canCall = toCall > 0 && seat.stack > toCall;
  const callAmount = Math.min(toCall, seat.stack);
  const minRaise = Math.max(minRaiseIncrement, bigBlind);
  const minRaiseTotal = currentBet + minRaise;
  const canRaise = seat.stack > toCall && seat.stack + seat.streetBet > minRaiseTotal;
  const maxRaise = seat.streetBet + seat.stack;
  const minRaiseAmount = canRaise
    ? Math.min(maxRaise, minRaiseTotal)
    : seat.streetBet + seat.stack;

  return {
    canFold: !seat.folded && !seat.allIn,
    canCheck,
    canCall: toCall > 0 && seat.stack > 0,
    callAmount,
    canRaise,
    minRaise: minRaiseAmount,
    maxRaise,
    canAllIn: seat.stack > 0 && !seat.allIn,
    allInAmount: seat.streetBet + seat.stack,
  };
}

export function canSeatAct(seat: Seat, seats: Seat[], lastAggressorIndex: number | null): boolean {
  if (seat.folded || seat.allIn) return false;
  if (seat.stack <= 0) return false;

  const currentBet = getCurrentBet(seats);
  const toCall = currentBet - seat.streetBet;

  if (toCall > 0) return true;
  if (!seat.actedThisRound) return true;
  if (lastAggressorIndex === seat.id) return false;

  const playersWhoCanBet = getPlayersWhoCanBet(seats);
  if (playersWhoCanBet.length <= 1) return false;

  return !seat.actedThisRound;
}

export function findNextActor(
  fromIndex: number,
  seats: Seat[],
  lastAggressorIndex: number | null
): number | null {
  const total = seats.length;
  let idx = nextSeatIndex(fromIndex, total);

  for (let i = 0; i < total; i++) {
    if (canSeatAct(seats[idx], seats, lastAggressorIndex)) {
      return idx;
    }
    idx = nextSeatIndex(idx, total);
  }
  return null;
}

export function isBettingRoundComplete(
  seats: Seat[],
  lastAggressorIndex: number | null
): boolean {
  const canBet = getPlayersWhoCanBet(seats);
  if (canBet.length === 0) return true;

  const currentBet = getCurrentBet(seats);

  for (const seat of canBet) {
    if (seat.streetBet < currentBet) return false;
    if (!seat.actedThisRound) return false;
  }

  if (lastAggressorIndex !== null) {
    const agg = seats[lastAggressorIndex];
    if (agg && !agg.folded && canBet.some((s) => s.id === lastAggressorIndex)) {
      return canBet.every((s) => s.streetBet === currentBet && s.actedThisRound);
    }
  }

  return canBet.every((s) => s.streetBet === currentBet && s.actedThisRound);
}

export function nextStreet(street: Street): Street | null {
  const order: Street[] = ["preflop", "flop", "turn", "river", "showdown"];
  const idx = order.indexOf(street);
  if (idx < 0 || idx >= order.length - 1) return null;
  return order[idx + 1];
}

export function communityCardsForStreet(street: Street): number {
  switch (street) {
    case "preflop":
      return 0;
    case "flop":
      return 3;
    case "turn":
      return 4;
    case "river":
      return 5;
    default:
      return 5;
  }
}
