import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const RIVETS = [
  "left-1.5 top-1.5",
  "right-1.5 top-1.5",
  "bottom-1.5 left-1.5",
  "bottom-1.5 right-1.5",
];

export function ChalkboardPanel({
  className,
  title,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { title?: string }) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-black/60 bg-[linear-gradient(145deg,#2a1a0c,#150c05)] p-2 shadow-skeuo-card",
        className,
      )}
      {...props}
    >
      {RIVETS.map((position) => (
        <span key={position} className={cn("rivet", position)} aria-hidden />
      ))}

      <div className="rounded-lg bg-chalkboard px-4 py-5 shadow-skeuo-inset">
        {title && (
          <div className="mb-4 flex items-center gap-2 border-b border-chalk/15 pb-3">
            <span
              className="h-2 w-2 rounded-full bg-led-text shadow-[0_0_8px_rgba(74,222,128,0.8)]"
              aria-hidden
            />
            <h2 className="text-graffiti text-xs tracking-[0.2em] text-chalk/70">
              {title}
            </h2>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
