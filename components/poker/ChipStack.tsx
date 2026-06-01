"use client";

import { formatChips } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type ChipStackProps = {
  amount: number;
  label?: string;
  className?: string;
  animate?: boolean;
};

export function ChipStack({ amount, label, className, animate = true }: ChipStackProps) {
  const Wrapper = animate ? motion.div : "div";
  const props = animate
    ? {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: "spring" as const, stiffness: 400, damping: 28 },
      }
    : {};

  return (
    <Wrapper
      {...props}
      className={cn(
        "inline-flex flex-col items-center gap-0.5",
        className
      )}
    >
      <div className="relative flex h-5 w-8 items-center justify-center">
        <span className="absolute h-5 w-8 rounded-full border-2 border-accent/60 bg-accent/20 shadow-[0_0_8px_rgba(201,169,98,0.3)]" />
        <span className="absolute h-4 w-7 rounded-full border border-white/20 bg-copper/40 -translate-y-0.5" />
      </div>
      <span className="text-[10px] font-semibold tabular-nums text-accent sm:text-xs">
        {label ?? formatChips(amount)}
      </span>
    </Wrapper>
  );
}
