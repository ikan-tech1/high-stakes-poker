"use client";

import { HeroTable } from "@/components/poker/HeroTable";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { Pill } from "@/components/ui/Pill";
import { saveSessionConfig } from "@/lib/poker/session";
import type { GameConfig, TableTheme } from "@/lib/poker/types";
import { generateGameId } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

const THEMES: { id: TableTheme; label: string }[] = [
  { id: "classic", label: "Classic Green" },
  { id: "noir", label: "Noir Gold" },
  { id: "velvet", label: "Velvet Red" },
];

const STACK_OPTIONS = [5000, 10000, 25000];
const BLIND_OPTIONS = [
  { sb: 25, bb: 50 },
  { sb: 50, bb: 100 },
  { sb: 100, bb: 200 },
];

export default function LobbyPage() {
  const router = useRouter();
  const [numBots, setNumBots] = useState(3);
  const [startingStack, setStartingStack] = useState(10000);
  const [blindIdx, setBlindIdx] = useState(0);
  const [theme, setTheme] = useState<TableTheme>("classic");

  const startGame = () => {
    const blinds = BLIND_OPTIONS[blindIdx];
    const config: GameConfig = {
      gameId: generateGameId(),
      numBots,
      startingStack,
      smallBlind: blinds.sb,
      bigBlind: blinds.bb,
      theme,
    };
    saveSessionConfig(config);
    router.push(`/play/${config.gameId}`);
  };

  return (
    <div className="mesh-bg min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <header className="text-center mb-8">
          <h1 className="font-display text-4xl sm:text-5xl text-accent tracking-wide mb-2">
            High Stakes
          </h1>
          <p className="text-muted text-sm sm:text-base">
            Premium Texas Hold&apos;em — play money, AI opponents
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2 items-start">
          <HeroTable />

          <Panel glass="specular" className="space-y-6">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted block mb-2">
                Opponents
              </label>
              <p className="text-[10px] text-muted mb-2 sm:hidden">
                On mobile, 3 bots max recommended for readability.
              </p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNumBots(n)}
                    className="focus:outline-none"
                  >
                    <Pill active={numBots === n}>{n} bot{n > 1 ? "s" : ""}</Pill>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-muted block mb-2">
                Starting stack
              </label>
              <div className="flex flex-wrap gap-2">
                {STACK_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStartingStack(s)}
                    className="focus:outline-none"
                  >
                    <Pill active={startingStack === s}>{s.toLocaleString()}</Pill>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-muted block mb-2">
                Blinds
              </label>
              <div className="flex flex-wrap gap-2">
                {BLIND_OPTIONS.map((b, i) => (
                  <button
                    key={b.bb}
                    type="button"
                    onClick={() => setBlindIdx(i)}
                    className="focus:outline-none"
                  >
                    <Pill active={blindIdx === i}>
                      {b.sb}/{b.bb}
                    </Pill>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-muted block mb-2">
                Table theme
              </label>
              <div className="flex flex-wrap gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className="focus:outline-none"
                  >
                    <Pill active={theme === t.id}>{t.label}</Pill>
                  </button>
                ))}
              </div>
            </div>

            <Button size="lg" className="w-full" onClick={startGame}>
              Deal me in
            </Button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
