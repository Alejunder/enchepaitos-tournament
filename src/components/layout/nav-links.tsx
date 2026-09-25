"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/torneos", label: "Torneos" },
  { href: "/rankings", label: "Rankings" },
  { href: "/h2h", label: "Cara a Cara" },
];

export function NavLinks({ showAdmin = false }: { showAdmin?: boolean }) {
  const pathname = usePathname();

  const items = showAdmin
    ? [...LINKS, { href: "/admin/users", label: "Admin" }]
    : LINKS;

  return (
    <>
      {items.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative transition-colors",
              active
                ? "text-beer after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-beer"
                : "text-chalk/70 hover:text-foam",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
