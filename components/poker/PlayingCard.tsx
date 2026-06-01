"use client";

import { cn } from "@/lib/utils";
import { RANK_LABELS, SUIT_SYMBOLS, type Card, type Suit } from "@/lib/poker/types";
import { motion } from "framer-motion";

const RED_SUITS: Suit[] = ["h", "d"];

type PlayingCardProps = {
  card?: Card | null;
  faceDown?: boolean;
  small?: boolean;
  className?: string;
  layoutId?: string;
};

export function PlayingCard({
  card,
  faceDown = false,
  small = false,
  className,
  layoutId,
}: PlayingCardProps) {
  const w = small ? "w-10 h-14" : "w-12 h-[4.25rem] sm:w-14 sm:h-20";
  const isRed = card && RED_SUITS.includes(card.suit);

  if (faceDown || !card) {
    return (
      <motion.div
        layoutId={layoutId}
        className={cn(
          w,
          "rounded-lg border border-white/20 bg-gradient-to-br from-[#1a2744] via-[#243b6b] to-[#152238] shadow-lg",
          "flex items-center justify-center",
          className
        )}
      >
        <div className="h-[70%] w-[75%] rounded border border-accent/30 bg-accent/10" />
      </motion.div>
    );
  }

  return (
    <motion.div
      layoutId={layoutId}
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={cn(
        w,
        "rounded-lg border border-white/30 bg-[#faf8f5] shadow-lg flex flex-col items-center justify-center gap-0.5",
        className
      )}
    >
      <span
        className={cn(
          "font-bold leading-none",
          small ? "text-sm" : "text-base sm:text-lg",
          isRed ? "text-red-600" : "text-neutral-900"
        )}
      >
        {RANK_LABELS[card.rank]}
      </span>
      <span className={cn(small ? "text-lg" : "text-xl sm:text-2xl", isRed ? "text-red-600" : "text-neutral-800")}>
        {SUIT_SYMBOLS[card.suit]}
      </span>
    </motion.div>
  );
}
