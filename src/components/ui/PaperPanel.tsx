import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function PaperPanel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative rounded-lg border border-[#a98b5f]/80 bg-paper px-5 py-4 text-ink shadow-skeuo-card",
        className,
      )}
      {...props}
    />
  );
}
