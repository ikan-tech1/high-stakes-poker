"use client";

import { usePokerStore } from "@/lib/poker/game-store";
import type { HandAction, Street } from "@/lib/poker/types";
import { formatChips } from "@/lib/utils";
import { Panel } from "../ui/Panel";

const STREET_ORDER: Street[] = ["preflop", "flop", "turn", "river", "showdown"];

function groupByStreet(actions: HandAction[]): Record<string, HandAction[]> {
  const groups: Record<string, HandAction[]> = {};
  for (const a of actions) {
    if (!groups[a.street]) groups[a.street] = [];
    groups[a.street].push(a);
  }
  return groups;
}

export function ActionLog() {
  const actions = usePokerStore((s) => s.actions);
  const grouped = groupByStreet(actions);

  return (
    <Panel glass="matte" className="h-full max-h-48 overflow-y-auto text-xs">
      <h3 className="font-display text-sm text-accent mb-2">Action log</h3>
      {actions.length === 0 ? (
        <p className="text-muted">No actions yet</p>
      ) : (
        <div className="space-y-3">
          {STREET_ORDER.filter((st) => grouped[st]?.length).map((street) => (
            <div key={street}>
              <p className="uppercase tracking-wider text-muted text-[10px] mb-1">
                {street}
              </p>
              <table className="w-full">
                <tbody>
                  {grouped[street].map((a, i) => (
                    <tr key={`${a.timestamp}-${i}`} className="text-foreground/90">
                      <td className="py-0.5 pr-2 text-muted w-16 truncate">{a.seatName}</td>
                      <td className="py-0.5 capitalize">{a.type}</td>
                      <td className="py-0.5 text-right tabular-nums text-accent">
                        {a.amount > 0 ? formatChips(a.amount) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
