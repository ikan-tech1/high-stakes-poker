"use client";

import { cn, formatChips } from "@/lib/utils";
import type { Seat as SeatType } from "@/lib/poker/types";
import { motion } from "framer-motion";
import { PlayingCard } from "./PlayingCard";

type SeatProps = {
  seat: SeatType;
  isActive: boolean;
  isDealer: boolean;
  showCards: boolean;
  positionStyle: React.CSSProperties;
};

export function Seat({
  seat,
  isActive,
  isDealer,
  showCards,
  positionStyle,
}: SeatProps) {
  const showHole =
    showCards || seat.isHero || (!seat.isBot && seat.holeCards.length > 0);

  return (
    <motion.div
      style={positionStyle}
      className={cn(
        "absolute z-10 flex flex-col items-center gap-1.5",
        seat.folded && "opacity-40"
      )}
      animate={
        isActive
          ? {
              boxShadow: [
                "0 0 0 0 rgba(201,169,98,0)",
                "0 0 24px 4px rgba(201,169,98,0.35)",
                "0 0 0 0 rgba(201,169,98,0)",
              ],
            }
          : {}
      }
      transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
    >
      <div
        className={cn(
          "glass-matte rounded-xl px-3 py-2 min-w-[88px] text-center transition-all",
          isActive && "ring-2 ring-accent/60 ring-offset-2 ring-offset-transparent"
        )}
      >
        <p className="text-xs font-medium truncate max-w-[100px]">
          {seat.name}
          {seat.isHero && (
            <span className="ml-1 text-accent text-[10px]">(You)</span>
          )}
        </p>
        <p className="text-sm font-semibold tabular-nums text-accent">
          {formatChips(seat.stack)}
        </p>
        {seat.streetBet > 0 && (
          <p className="text-[10px] text-muted">Bet {formatChips(seat.streetBet)}</p>
        )}
        {seat.allIn && (
          <span className="text-[10px] font-bold text-danger uppercase">All in</span>
        )}
      </div>

      {isDealer && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-background">
          D
        </span>
      )}

      <div className="flex gap-1">
        <PlayingCard
          card={seat.holeCards[0]}
          faceDown={!showHole || seat.holeCards.length === 0}
          small
        />
        <PlayingCard
          card={seat.holeCards[1]}
          faceDown={!showHole || seat.holeCards.length < 2}
          small
        />
      </div>
    </motion.div>
  );
}
