"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SaveState = "dirty" | "saving" | "saved";

export function SaveButton({
  state,
  dirtyLabel = "Guardar",
  savedLabel = "Guardado ✓",
  className,
  ...props
}: {
  state: SaveState;
  dirtyLabel?: string;
  savedLabel?: string;
} & Omit<ButtonProps, "variant" | "type" | "children">) {
  if (state === "saved") {
    return (
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className={cn("text-chalk/50", className)}
        {...props}
      >
        {savedLabel}
      </Button>
    );
  }

  return (
    <Button
      type="submit"
      variant="primary"
      size="sm"
      disabled={state === "saving"}
      className={className}
      {...props}
    >
      {state === "saving" ? "Guardando..." : dirtyLabel}
    </Button>
  );
}
