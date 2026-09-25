import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const TONES: Record<Tone, string> = {
  neutral: "border-white/10 bg-black/40 text-chalk/80",
  success: "border-led-text/30 bg-black/40 text-led-text",
  warning: "border-beer/30 bg-black/40 text-beer",
  danger: "border-red-500/30 bg-black/40 text-red-400",
  info: "border-sky-400/30 bg-black/40 text-sky-300",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
