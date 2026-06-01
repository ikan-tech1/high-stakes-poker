"use client";

import { formatChips } from "@/lib/utils";
import type { SidePot } from "@/lib/poker/types";
import { motion } from "framer-motion";
import { ChipStack } from "./ChipStack";

type PotDisplayProps = {
  pot: number;
  sidePots: SidePot[];
};

export function PotDisplay({ pot, sidePots }: PotDisplayProps) {
  return (
    <motion.div
      key={pot}
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      className="flex flex-col items-center gap-1"
    >
      <ChipStack amount={pot} label={`Pot ${formatChips(pot)}`} />
      {sidePots.length > 1 && (
        <p className="text-[10px] text-muted">{sidePots.length} side pots</p>
      )}
    </motion.div>
  );
}
