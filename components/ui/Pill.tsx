import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type PillProps = HTMLAttributes<HTMLSpanElement> & {
  active?: boolean;
};

export function Pill({ className, active, children, ...props }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-accent/20 text-accent border border-accent/40"
          : "glass-matte text-muted border border-border",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
