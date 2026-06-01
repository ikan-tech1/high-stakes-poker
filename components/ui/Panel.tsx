import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type PanelProps = HTMLAttributes<HTMLDivElement> & {
  glass?: "matte" | "frost" | "specular" | "none";
};

export function Panel({ className, glass = "frost", children, ...props }: PanelProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-4",
        glass === "matte" && "glass-matte",
        glass === "frost" && "glass-frost",
        glass === "specular" && "glass-specular",
        glass === "none" && "bg-surface border border-border",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
