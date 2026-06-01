import type { GameConfig } from "./types";

const SESSION_KEY = "poker-session";

export function saveSessionConfig(config: GameConfig): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(config));
}

export function loadSessionConfig(gameId: string): GameConfig | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const config = JSON.parse(raw) as GameConfig;
    if (config.gameId !== gameId) return null;
    return config;
  } catch {
    return null;
  }
}
