"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export function TeamBadge({
  src,
  name,
  className,
}: {
  src: string | null | undefined;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        className={cn(
          "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/40 text-[0.6rem]",
          className,
        )}
        aria-hidden
      >
        🛡
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`Escudo de ${name}`}
      className={cn("h-5 w-5 shrink-0 object-contain", className)}
      onError={() => setFailed(true)}
    />
  );
}
