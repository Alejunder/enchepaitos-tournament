import Link from "next/link";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-beer-liquid text-leather-dark shadow-skeuo-btn hover:brightness-110 focus-visible:outline-beer",
  secondary:
    "bg-silver-gradient text-leather-dark shadow-skeuo-btn hover:brightness-105 focus-visible:outline-silver",
  ghost:
    "bg-transparent text-chalk/80 hover:bg-white/10 hover:text-chalk focus-visible:outline-chalk/40",
  danger:
    "bg-gradient-to-b from-red-500 to-red-800 text-white shadow-skeuo-btn hover:brightness-110 focus-visible:outline-red-500",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}): string {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 rounded-lg font-semibold tracking-wide transition-all duration-100 active:translate-y-1 active:shadow-skeuo-btn-active disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  return (
    <Link href={href} className={buttonClasses({ variant, size, className })}>
      {children}
    </Link>
  );
}
