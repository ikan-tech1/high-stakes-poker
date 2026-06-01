"use client";

import { botThinkDelayMs, decideBotAction } from "@/lib/engine/bot";
import { usePokerStore } from "@/lib/poker/game-store";
import type { TableTheme } from "@/lib/poker/types";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { Button } from "../ui/Button";
import { Panel } from "../ui/Panel";
import { ActionBar } from "./ActionBar";
import { ActionLog } from "./ActionLog";
import { PokerTable } from "./PokerTable";

const THEME_CLASS: Record<TableTheme, string> = {
  classic: "",
  noir: "theme-noir",
  velvet: "theme-velvet",
};

type GameRoomProps = {
  theme: TableTheme;
};

export function GameRoom({ theme }: GameRoomProps) {
  const status = usePokerStore((s) => s.status);
  const actionIndex = usePokerStore((s) => s.actionIndex);
  const seats = usePokerStore((s) => s.seats);
  const street = usePokerStore((s) => s.street);
  const communityCards = usePokerStore((s) => s.communityCards);
  const pot = usePokerStore((s) => s.pot);
  const config = usePokerStore((s) => s.config);
  const winners = usePokerStore((s) => s.winners);
  const message = usePokerStore((s) => s.message);
  const handNumber = usePokerStore((s) => s.handNumber);
  const dispatchAction = usePokerStore((s) => s.dispatchAction);
  const getLegalActionsForSeat = usePokerStore((s) => s.getLegalActionsForSeat);
  const setBotThinking = usePokerStore((s) => s.setBotThinking);
  const nextHand = usePokerStore((s) => s.nextHand);
  const isBotThinking = usePokerStore((s) => s.isBotThinking);

  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== "betting" || actionIndex === null || !config) return;

    const seat = seats[actionIndex];
    if (!seat?.isBot || seat.folded || seat.allIn) return;

    const legal = getLegalActionsForSeat(actionIndex);
    if (!legal) return;

    setBotThinking(true);
    botTimerRef.current = setTimeout(() => {
      const state = usePokerStore.getState();
      const currentSeat = state.seats[state.actionIndex ?? -1];
      if (!currentSeat?.isBot || state.status !== "betting") {
        setBotThinking(false);
        return;
      }
      const currentLegal = state.getLegalActionsForSeat(currentSeat.id);
      if (!currentLegal || !state.config) {
        setBotThinking(false);
        return;
      }

      const decision = decideBotAction(
        currentSeat,
        state.seats,
        state.communityCards,
        state.street,
        currentLegal,
        state.config,
        currentSeat.id,
        state.pot
      );

      state.dispatchAction(currentSeat.id, decision.type, decision.amount);
      setBotThinking(false);
    }, botThinkDelayMs());

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      setBotThinking(false);
    };
  }, [
    actionIndex,
    status,
    street,
    seats,
    config,
    communityCards,
    pot,
    dispatchAction,
    getLegalActionsForSeat,
    setBotThinking,
  ]);

  return (
    <div className="mesh-bg min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 glass-matte border-b border-border">
        <div>
          <h1 className="font-display text-lg text-accent tracking-wide">High Stakes</h1>
          <p className="text-xs text-muted">Hand #{handNumber} · {street}</p>
        </div>
        {message && <p className="text-xs text-foreground/80 max-w-[50%] text-right">{message}</p>}
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-6xl mx-auto w-full">
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <PokerTable themeClass={THEME_CLASS[theme]} />
          <ActionBar />
        </div>

        <aside className="w-full lg:w-64 shrink-0">
          <ActionLog />
        </aside>
      </main>

      {status === "hand_complete" && winners && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Panel glass="specular" className="max-w-md w-full text-center space-y-4">
            <h2 className="font-display text-2xl text-accent">Hand result</h2>
            <ul className="space-y-2 text-sm">
              {winners.map((w) => (
                <li key={w.seatId}>
                  <span className="font-semibold">{w.seatName}</span> wins{" "}
                  <span className="text-accent">{w.amount}</span>
                  <span className="text-muted"> — {w.handName}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full" onClick={() => nextHand()}>
              Next hand
            </Button>
          </Panel>
        </div>
      )}

      {isBotThinking && (
        <div
          className={cn(
            "fixed bottom-24 left-1/2 -translate-x-1/2 glass-matte px-4 py-2 rounded-full text-xs text-muted"
          )}
        >
          Bot thinking…
        </div>
      )}
    </div>
  );
}
