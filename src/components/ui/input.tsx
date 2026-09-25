import { type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-leather-stitch/50 bg-black/40 px-3 text-sm text-chalk shadow-skeuo-inset placeholder:text-chalk/40 focus:border-beer focus:outline-none focus:ring-2 focus:ring-beer/30",
        className,
      )}
      {...props}
    />
  );
}
