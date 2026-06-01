"use client";

import { create } from "zustand";
import { createDeck, drawCards, shuffleDeck } from "./deck";
import { calculateSidePots } from "./pots";
import {
  countNotFolded,
  findNextActor,
  getActiveSeats,
  getBigBlindIndex,
  getCurrentBet,
  getFirstPostflopActor,
  getFirstPreflopActor,
  getLegalActions,
  getPlayersWhoCanBet,
  getSmallBlindIndex,
  isBettingRoundComplete,
  nextSeatIndex,
  nextStreet,
  communityCardsForStreet,
  seatCount,
} from "./rules";
import { mergeWinnerPayouts, resolveShowdownWinners } from "./showdown";
import type {
  ActionType,
  Card,
  GameConfig,
  HandAction,
  HandResult,
  HandStatus,
  LegalActions,
  Seat,
  SidePot,
  Street,
  WinnerInfo,
} from "./types";

function createSeats(config: GameConfig): Seat[] {
  const total = seatCount(config);
  const seats: Seat[] = [
    {
      id: 0,
      name: "You",
      stack: config.startingStack,
      streetBet: 0,
      holeCards: [],
      folded: false,
      allIn: false,
      isBot: false,
      isHero: true,
      actedThisRound: false,
    },
  ];
  for (let i = 1; i < total; i++) {
    seats.push({
      id: i,
      name: `Bot ${i}`,
      stack: config.startingStack,
      streetBet: 0,
      holeCards: [],
      folded: false,
      allIn: false,
      isBot: true,
      isHero: false,
      actedThisRound: false,
    });
  }
  return seats;
}

function resetSeatForHand(seat: Seat): Seat {
  return {
    ...seat,
    streetBet: 0,
    holeCards: [],
    folded: false,
    allIn: false,
    actedThisRound: false,
  };
}

function postBlind(
  seats: Seat[],
  seatId: number,
  amount: number,
  contributions: Record<number, number>
): { seats: Seat[]; potAdded: number; contributions: Record<number, number> } {
  const seat = seats[seatId];
  const post = Math.min(amount, seat.stack);
  const newStack = seat.stack - post;
  const newBet = seat.streetBet + post;
  const allIn = newStack === 0;

  const updated = seats.map((s) =>
    s.id === seatId
      ? {
          ...s,
          stack: newStack,
          streetBet: newBet,
          allIn,
          actedThisRound: true,
        }
      : s
  );

  return {
    seats: updated,
    potAdded: post,
    contributions: { ...contributions, [seatId]: (contributions[seatId] ?? 0) + post },
  };
}

function applyActionToSeat(
  seat: Seat,
  type: ActionType,
  amount: number | undefined,
  currentBet: number,
  minRaiseIncrement: number
): {
  seat: Seat;
  addedToPot: number;
  newCurrentBet: number;
  newMinRaise: number;
  isRaise: boolean;
} {
  if (type === "fold") {
    return {
      seat: { ...seat, folded: true, actedThisRound: true },
      addedToPot: 0,
      newCurrentBet: currentBet,
      newMinRaise: minRaiseIncrement,
      isRaise: false,
    };
  }

  if (type === "check") {
    return {
      seat: { ...seat, actedThisRound: true },
      addedToPot: 0,
      newCurrentBet: currentBet,
      newMinRaise: minRaiseIncrement,
      isRaise: false,
    };
  }

  const toCall = Math.max(0, currentBet - seat.streetBet);

  if (type === "call") {
    const pay = Math.min(toCall, seat.stack);
    const newStack = seat.stack - pay;
    return {
      seat: {
        ...seat,
        stack: newStack,
        streetBet: seat.streetBet + pay,
        allIn: newStack === 0,
        actedThisRound: true,
      },
      addedToPot: pay,
      newCurrentBet: currentBet,
      newMinRaise: minRaiseIncrement,
      isRaise: false,
    };
  }

  const targetTotal =
    type === "all_in" ? seat.streetBet + seat.stack : (amount ?? seat.streetBet + seat.stack);
  const pay = targetTotal - seat.streetBet;
  const actualPay = Math.min(pay, seat.stack);
  const newStack = seat.stack - actualPay;
  const newBet = seat.streetBet + actualPay;
  let newCurrentBet = currentBet;
  let newMinRaise = minRaiseIncrement;
  let isRaise = false;

  if (newBet > currentBet) {
    isRaise = true;
    newMinRaise = Math.max(minRaiseIncrement, newBet - currentBet);
    newCurrentBet = newBet;
  }

  return {
    seat: {
      ...seat,
      stack: newStack,
      streetBet: newBet,
      allIn: newStack === 0,
      actedThisRound: true,
    },
    addedToPot: actualPay,
    newCurrentBet,
    newMinRaise,
    isRaise,
  };
}

function rebuildPots(
  seats: Seat[],
  contributions: Record<number, number>
): { pot: number; sidePots: SidePot[] } {
  const contribMap = new Map<number, number>();
  for (const s of seats) {
    contribMap.set(s.id, contributions[s.id] ?? 0);
  }
  const sidePots = calculateSidePots(seats, contribMap);
  const pot = sidePots.reduce((sum, p) => sum + p.amount, 0);
  return { pot, sidePots };
}

function dealCommunityTo(
  deck: Card[],
  community: Card[],
  target: number
): { deck: Card[]; community: Card[] } {
  let remaining = deck;
  let board = [...community];
  while (board.length < target && remaining.length > 0) {
    const burn = drawCards(remaining, 1);
    remaining = burn.remaining;
    const need = target - board.length;
    const draw = drawCards(remaining, Math.min(need, remaining.length));
    remaining = draw.remaining;
    board = [...board, ...draw.drawn];
  }
  return { deck: remaining, community: board };
}

type PokerStore = {
  config: GameConfig | null;
  seats: Seat[];
  deck: Card[];
  communityCards: Card[];
  street: Street;
  dealerIndex: number;
  actionIndex: number | null;
  pot: number;
  sidePots: SidePot[];
  contributions: Record<number, number>;
  actions: HandAction[];
  status: HandStatus;
  handNumber: number;
  winners: WinnerInfo[] | null;
  lastResult: HandResult | null;
  lastAggressorIndex: number | null;
  minRaiseIncrement: number;
  showHoleCards: boolean;
  isBotThinking: boolean;
  message: string | null;

  initGame: (config: GameConfig) => void;
  startHand: () => void;
  dispatchAction: (seatId: number, type: ActionType, amount?: number) => boolean;
  getLegalActionsForSeat: (seatId: number) => LegalActions | null;
  nextHand: () => void;
  setBotThinking: (v: boolean) => void;
};

export const usePokerStore = create<PokerStore>((set, get) => {
  const resolveShowdown = () => {
    const state = get();
    let { seats, communityCards, contributions, deck } = state;

    if (communityCards.length < 5) {
      const dealt = dealCommunityTo(deck, communityCards, 5);
      communityCards = dealt.community;
      deck = dealt.deck;
    }

    const pots = rebuildPots(seats, contributions);
    const rawWinners = resolveShowdownWinners(seats, communityCards, pots.sidePots);
    const winners = mergeWinnerPayouts(rawWinners);

    seats = seats.map((s) => {
      const win = winners.find((w) => w.seatId === s.id);
      return win ? { ...s, stack: s.stack + win.amount } : s;
    });

    set({
      seats,
      deck,
      communityCards,
      pot: 0,
      sidePots: [],
      contributions: {},
      status: "hand_complete",
      winners,
      lastResult: { winners, handNumber: state.handNumber },
      actionIndex: null,
      showHoleCards: true,
      street: "showdown",
      message: winners.map((w) => `${w.seatName} wins ${w.amount} (${w.handName})`).join(" · "),
    });
  };

  const advanceStreet = () => {
    const state = get();
    const { config, seats, deck, street, dealerIndex, contributions } = state;
    if (!config) return;

    const canBet = getPlayersWhoCanBet(seats);
    const active = getActiveSeats(seats);

    if (canBet.length <= 1 && active.length >= 2) {
      const dealt = dealCommunityTo(deck, state.communityCards, 5);
      set({
        deck: dealt.deck,
        communityCards: dealt.community,
        street: "showdown",
        showHoleCards: true,
      });
      resolveShowdown();
      return;
    }

    const next = nextStreet(street);
    if (!next || next === "showdown") {
      set({ street: "showdown", showHoleCards: true });
      resolveShowdown();
      return;
    }

    const targetCount = communityCardsForStreet(next);
    const dealt = dealCommunityTo(deck, state.communityCards, targetCount);

    const resetSeats = seats.map((s) => ({
      ...s,
      streetBet: 0,
      actedThisRound: false,
    }));

    const canAct = resetSeats.some((s) => !s.folded && !s.allIn && s.stack > 0);
    if (!canAct) {
      set({
        deck: dealt.deck,
        communityCards: dealt.community,
        street: next,
        seats: resetSeats,
        lastAggressorIndex: null,
      });
      advanceStreet();
      return;
    }

    const firstActor = getFirstPostflopActor(dealerIndex, resetSeats);
    set({
      deck: dealt.deck,
      communityCards: dealt.community,
      street: next,
      seats: resetSeats,
      actionIndex: firstActor,
      lastAggressorIndex: null,
      minRaiseIncrement: config.bigBlind,
    });
  };

  const continueAfterAction = (seatId: number) => {
    const state = get();
    if (isBettingRoundComplete(state.seats, state.lastAggressorIndex)) {
      advanceStreet();
      return;
    }
    const next = findNextActor(seatId, state.seats, state.lastAggressorIndex);
    if (next === null) {
      advanceStreet();
      return;
    }
    set({ actionIndex: next });
  };

  return {
    config: null,
    seats: [],
    deck: [],
    communityCards: [],
    street: "preflop",
    dealerIndex: 0,
    actionIndex: null,
    pot: 0,
    sidePots: [],
    contributions: {},
    actions: [],
    status: "idle",
    handNumber: 0,
    winners: null,
    lastResult: null,
    lastAggressorIndex: null,
    minRaiseIncrement: 50,
    showHoleCards: false,
    isBotThinking: false,
    message: null,

    initGame: (config) => {
      const seats = createSeats(config);
      set({
        config,
        seats,
        deck: [],
        communityCards: [],
        street: "preflop",
        dealerIndex: 0,
        actionIndex: null,
        pot: 0,
        sidePots: [],
        contributions: {},
        actions: [],
        status: "idle",
        handNumber: 0,
        winners: null,
        lastResult: null,
        lastAggressorIndex: null,
        minRaiseIncrement: config.bigBlind,
        showHoleCards: false,
        isBotThinking: false,
        message: null,
      });
      get().startHand();
    },

    startHand: () => {
      const { config, seats, dealerIndex, handNumber } = get();
      if (!config) return;

      const playersWithChips = seats.filter((s) => s.stack > 0);
      if (playersWithChips.length < 2) {
        set({ status: "hand_complete", message: "Game over — not enough chips to continue." });
        return;
      }

      const total = seats.length;
      let newDealer = dealerIndex;
      for (let i = 0; i < total; i++) {
        newDealer = nextSeatIndex(newDealer, total);
        if (seats[newDealer].stack > 0) break;
      }

      let updatedSeats = seats.map((s) =>
        s.stack > 0 ? resetSeatForHand(s) : { ...s, folded: true, holeCards: [], streetBet: 0 }
      );

      let deck = shuffleDeck(createDeck());
      let contributions: Record<number, number> = {};
      let potAdded = 0;

      const sbIdx = getSmallBlindIndex(newDealer, total);
      const bbIdx = getBigBlindIndex(newDealer, total);

      let br = postBlind(updatedSeats, sbIdx, config.smallBlind, contributions);
      updatedSeats = br.seats;
      potAdded += br.potAdded;
      contributions = br.contributions;

      br = postBlind(updatedSeats, bbIdx, config.bigBlind, contributions);
      updatedSeats = br.seats;
      potAdded += br.potAdded;
      contributions = br.contributions;

      for (let i = 0; i < updatedSeats.length; i++) {
        if (updatedSeats[i].folded) continue;
        const draw = drawCards(deck, 2);
        deck = draw.remaining;
        updatedSeats[i] = { ...updatedSeats[i], holeCards: draw.drawn };
      }

      const firstActor = getFirstPreflopActor(newDealer, total);
      const pots = rebuildPots(updatedSeats, contributions);

      set({
        seats: updatedSeats,
        deck,
        communityCards: [],
        street: "preflop",
        dealerIndex: newDealer,
        actionIndex: firstActor,
        pot: pots.pot,
        sidePots: pots.sidePots,
        contributions,
        actions: [],
        status: "betting",
        handNumber: handNumber + 1,
        winners: null,
        lastAggressorIndex: bbIdx,
        minRaiseIncrement: config.bigBlind,
        showHoleCards: false,
        message: null,
      });
    },

    dispatchAction: (seatId, type, amount) => {
      const state = get();
      if (state.status !== "betting" || state.actionIndex !== seatId) return false;

      const seat = state.seats[seatId];
      if (!seat || seat.folded || seat.allIn) return false;

      const legal = getLegalActions(
        seat,
        state.seats,
        state.minRaiseIncrement,
        state.config?.bigBlind ?? 50
      );

      if (type === "fold" && !legal.canFold) return false;
      if (type === "check" && !legal.canCheck) return false;
      if (type === "call" && !legal.canCall) return false;
      if (type === "raise" && !legal.canRaise) return false;
      if (type === "all_in" && !legal.canAllIn) return false;

      const currentBet = getCurrentBet(state.seats);
      const result = applyActionToSeat(
        seat,
        type,
        amount,
        currentBet,
        state.minRaiseIncrement
      );

      let seats = state.seats.map((s) => (s.id === seatId ? result.seat : s));
      const contributions = {
        ...state.contributions,
        [seatId]: (state.contributions[seatId] ?? 0) + result.addedToPot,
      };

      const action: HandAction = {
        seatId,
        seatName: seat.name,
        type,
        amount: result.addedToPot,
        street: state.street,
        timestamp: Date.now(),
      };

      let lastAggressorIndex = state.lastAggressorIndex;
      if (result.isRaise) {
        lastAggressorIndex = seatId;
        seats = seats.map((s) =>
          s.id !== seatId && !s.folded && !s.allIn ? { ...s, actedThisRound: false } : s
        );
      }

      if (countNotFolded(seats) === 1) {
        const winner = seats.find((s) => !s.folded)!;
        const pots = rebuildPots(seats, contributions);
        const payout = pots.pot;
        seats = seats.map((s) =>
          s.id === winner.id ? { ...s, stack: s.stack + payout } : s
        );
        const winners: WinnerInfo[] = [
          {
            seatId: winner.id,
            seatName: winner.name,
            amount: payout,
            handName: "Everyone folded",
            cards: winner.holeCards,
          },
        ];
        set({
          seats,
          pot: 0,
          sidePots: [],
          contributions: {},
          actions: [...state.actions, action],
          status: "hand_complete",
          winners,
          lastResult: { winners, handNumber: state.handNumber },
          actionIndex: null,
          showHoleCards: true,
          message: `${winner.name} wins ${payout}`,
        });
        return true;
      }

      const pots = rebuildPots(seats, contributions);

      set({
        seats,
        pot: pots.pot,
        sidePots: pots.sidePots,
        contributions,
        actions: [...state.actions, action],
        lastAggressorIndex,
        minRaiseIncrement: result.newMinRaise,
      });

      continueAfterAction(seatId);
      return true;
    },

    getLegalActionsForSeat: (seatId) => {
      const { seats, minRaiseIncrement, config, status, actionIndex } = get();
      if (status !== "betting" || actionIndex !== seatId) return null;
      const seat = seats[seatId];
      if (!seat) return null;
      return getLegalActions(seat, seats, minRaiseIncrement, config?.bigBlind ?? 50);
    },

    nextHand: () => {
      get().startHand();
    },

    setBotThinking: (v) => set({ isBotThinking: v }),
  };
});
