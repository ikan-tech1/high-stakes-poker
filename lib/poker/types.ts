export type Suit = "h" | "d" | "c" | "s";
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export type Card = {
  rank: Rank;
  suit: Suit;
};

export type Street = "preflop" | "flop" | "turn" | "river" | "showdown";

export type ActionType = "fold" | "check" | "call" | "raise" | "all_in";

export type TableTheme = "classic" | "noir" | "velvet";

export type GameConfig = {
  gameId: string;
  numBots: number;
  startingStack: number;
  smallBlind: number;
  bigBlind: number;
  theme: TableTheme;
};

export type Seat = {
  id: number;
  name: string;
  stack: number;
  streetBet: number;
  holeCards: Card[];
  folded: boolean;
  allIn: boolean;
  isBot: boolean;
  isHero: boolean;
  actedThisRound: boolean;
};

export type HandAction = {
  seatId: number;
  seatName: string;
  type: ActionType;
  amount: number;
  street: Street;
  timestamp: number;
};

export type SidePot = {
  amount: number;
  eligibleSeatIds: number[];
};

export type WinnerInfo = {
  seatId: number;
  seatName: string;
  amount: number;
  handName: string;
  cards: Card[];
};

export type HandResult = {
  winners: WinnerInfo[];
  handNumber: number;
};

export type LegalActions = {
  canFold: boolean;
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  canRaise: boolean;
  minRaise: number;
  maxRaise: number;
  canAllIn: boolean;
  allInAmount: number;
};

export type HandStatus = "betting" | "showdown" | "hand_complete" | "idle";

export const RANK_LABELS: Record<Rank, string> = {
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "J",
  12: "Q",
  13: "K",
  14: "A",
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  h: "♥",
  d: "♦",
  c: "♣",
  s: "♠",
};
