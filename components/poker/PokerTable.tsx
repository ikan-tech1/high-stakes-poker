"use client";

import { usePokerStore } from "@/lib/poker/game-store";
import { getSeatPosition } from "@/lib/poker/seat-layout";
import { cn } from "@/lib/utils";
import { CommunityCards } from "./CommunityCards";
import { PotDisplay } from "./PotDisplay";
import { Seat } from "./Seat";

type PokerTableProps = {
  themeClass?: string;
};

export function PokerTable({ themeClass }: PokerTableProps) {
  const seats = usePokerStore((s) => s.seats);
  const communityCards = usePokerStore((s) => s.communityCards);
  const pot = usePokerStore((s) => s.pot);
  const sidePots = usePokerStore((s) => s.sidePots);
  const actionIndex = usePokerStore((s) => s.actionIndex);
  const dealerIndex = usePokerStore((s) => s.dealerIndex);
  const showHoleCards = usePokerStore((s) => s.showHoleCards);
  const street = usePokerStore((s) => s.street);
  const isBotThinking = usePokerStore((s) => s.isBotThinking);

  return (
    <div className={cn("relative w-full max-w-3xl mx-auto aspect-[4/3] sm:aspect-[16/11]", themeClass)}>
      <div
        className={cn(
          "absolute inset-[8%] rounded-[50%] felt-surface border-4 border-accent/20",
          "shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"
        )}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="mt-[18%] sm:mt-[20%] flex flex-col items-center gap-3">
          <PotDisplay pot={pot} sidePots={sidePots} />
          <CommunityCards cards={communityCards} />
          <p className="text-[10px] uppercase tracking-widest text-muted/80">
            {street === "showdown" ? "Showdown" : street}
            {isBotThinking && " · thinking…"}
          </p>
        </div>
      </div>

      {seats.map((seat) => (
        <Seat
          key={seat.id}
          seat={seat}
          isActive={actionIndex === seat.id && !seat.folded}
          isDealer={dealerIndex === seat.id}
          showCards={showHoleCards}
          positionStyle={getSeatPosition(seat.id, seats.length)}
        />
      ))}
    </div>
  );
}
