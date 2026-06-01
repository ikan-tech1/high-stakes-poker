import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatChips(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 10_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toLocaleString();
}

export function generateGameId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function potOdds(toCall: number, pot: number): number {
  if (toCall <= 0) return 1;
  return pot / (pot + toCall);
}
