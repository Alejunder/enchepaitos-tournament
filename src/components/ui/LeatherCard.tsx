import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function LeatherCard({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "leather-stitch relative rounded-xl border border-leather-stitch/70 bg-leather-texture p-6 shadow-skeuo-card",
        className,
      )}
      {...props}
    />
  );
}

export function LeatherCardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold text-chalk", className)}
      {...props}
    />
  );
}
