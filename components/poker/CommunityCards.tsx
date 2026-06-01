"use client";

import type { Card } from "@/lib/poker/types";
import { PlayingCard } from "./PlayingCard";

type CommunityCardsProps = {
  cards: Card[];
};

export function CommunityCards({ cards }: CommunityCardsProps) {
  const slots = [0, 1, 2, 3, 4];

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
      {slots.map((i) => (
        <PlayingCard
          key={i}
          card={cards[i] ?? null}
          faceDown={!cards[i]}
          layoutId={`board-${i}`}
        />
      ))}
    </div>
  );
}
