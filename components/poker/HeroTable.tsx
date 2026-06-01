"use client";

import { motion } from "framer-motion";
import { PlayingCard } from "./PlayingCard";

export function HeroTable() {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-[16/10]">
      <div className="absolute inset-[10%] rounded-[50%] felt-surface border-2 border-accent/30 opacity-90" />
      <motion.div
        className="absolute left-[30%] top-[38%]"
        animate={{ y: [0, -6, 0], rotate: [-3, 3, -3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <PlayingCard card={{ rank: 14, suit: "s" }} small />
      </motion.div>
      <motion.div
        className="absolute right-[30%] top-[38%]"
        animate={{ y: [0, -8, 0], rotate: [3, -3, 3] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
      >
        <PlayingCard card={{ rank: 13, suit: "h" }} small />
      </motion.div>
      <motion.div
        className="absolute left-1/2 top-[32%] -translate-x-1/2 flex gap-1"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <PlayingCard faceDown small />
        <PlayingCard faceDown small />
        <PlayingCard faceDown small />
      </motion.div>
      <p className="absolute bottom-[18%] left-1/2 -translate-x-1/2 text-xs text-accent/80 font-display tracking-widest uppercase">
        Texas Hold&apos;em
      </p>
    </div>
  );
}
