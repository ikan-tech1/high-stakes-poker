"use client";

import { GameRoom } from "@/components/poker/GameRoom";
import { usePokerStore } from "@/lib/poker/game-store";
import { loadSessionConfig } from "@/lib/poker/session";
import type { TableTheme } from "@/lib/poker/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function PlayPage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const initGame = usePokerStore((s) => s.initGame);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<TableTheme>("classic");
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    const config = loadSessionConfig(gameId);
    if (!config) {
      setError("Session not found. Start a new game from the lobby.");
      return;
    }
    initialized.current = true;
    setTheme(config.theme);
    initGame(config);
    setReady(true);
  }, [gameId, initGame]);

  if (error) {
    return (
      <div className="mesh-bg min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-muted text-center">{error}</p>
        <Link href="/" className="text-accent hover:underline">
          Back to lobby
        </Link>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="mesh-bg min-h-screen flex items-center justify-center">
        <p className="text-muted animate-pulse">Shuffling deck…</p>
      </div>
    );
  }

  return <GameRoom theme={theme} />;
}
