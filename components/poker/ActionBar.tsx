"use client";

import { usePokerStore } from "@/lib/poker/game-store";
import { formatChips } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/Button";
import { Panel } from "../ui/Panel";

export function ActionBar() {
  const status = usePokerStore((s) => s.status);
  const actionIndex = usePokerStore((s) => s.actionIndex);
  const seats = usePokerStore((s) => s.seats);
  const pot = usePokerStore((s) => s.pot);
  const dispatchAction = usePokerStore((s) => s.dispatchAction);
  const getLegalActionsForSeat = usePokerStore((s) => s.getLegalActionsForSeat);
  const isBotThinking = usePokerStore((s) => s.isBotThinking);

  const hero = seats.find((s) => s.isHero);
  const isHeroTurn = hero && actionIndex === hero.id && status === "betting";

  const legal = useMemo(
    () => (hero ? getLegalActionsForSeat(hero.id) : null),
    [hero, getLegalActionsForSeat, actionIndex, seats, status]
  );

  const [raiseAmount, setRaiseAmount] = useState(0);

  const minR = legal?.minRaise ?? 0;
  const maxR = legal?.maxRaise ?? 0;

  useEffect(() => {
    if (legal?.canRaise) setRaiseAmount(legal.minRaise);
  }, [legal?.minRaise, legal?.canRaise, actionIndex]);

  if (!isHeroTurn || !legal) {
    return (
      <Panel glass="frost" className="text-center text-sm text-muted py-4">
        {isBotThinking
          ? "Opponent is thinking…"
          : status === "hand_complete"
            ? "Hand complete"
            : "Waiting for your turn…"}
      </Panel>
    );
  }

  const halfPot = Math.min(
    maxR,
    Math.max(minR, (hero?.streetBet ?? 0) + Math.floor(pot / 2))
  );
  const potBet = Math.min(maxR, Math.max(minR, (hero?.streetBet ?? 0) + pot));

  return (
    <Panel glass="frost" className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-center">
        {legal.canFold && (
          <Button variant="danger" size="sm" onClick={() => dispatchAction(hero!.id, "fold")}>
            Fold
          </Button>
        )}
        {legal.canCheck && (
          <Button variant="secondary" size="sm" onClick={() => dispatchAction(hero!.id, "check")}>
            Check
          </Button>
        )}
        {legal.canCall && (
          <Button variant="secondary" size="sm" onClick={() => dispatchAction(hero!.id, "call")}>
            Call {formatChips(legal.callAmount)}
          </Button>
        )}
        {legal.canAllIn && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => dispatchAction(hero!.id, "all_in")}
          >
            All in
          </Button>
        )}
      </div>

      {legal.canRaise && (
        <div className="space-y-2">
          <div className="flex gap-2 justify-center flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRaiseAmount(halfPot)}
            >
              ½ pot
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setRaiseAmount(potBet)}>
              Pot
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setRaiseAmount(maxR)}>
              Max
            </Button>
          </div>
          <input
            type="range"
            min={minR}
            max={maxR}
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <Button
            variant="primary"
            className="w-full"
            onClick={() => dispatchAction(hero!.id, "raise", raiseAmount)}
          >
            Raise to {formatChips(raiseAmount)}
          </Button>
        </div>
      )}
    </Panel>
  );
}
