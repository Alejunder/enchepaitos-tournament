import Link from "next/link";

import { signOut } from "@/app/api/actions/auth";
import { getCurrentProfile } from "@/lib/auth";
import { canAdmin } from "@/lib/guards";
import { NavLinks } from "@/components/layout/nav-links";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";

export async function SiteHeader() {
  const profile = await getCurrentProfile();

  return (
    <header className="border-b border-leather-stitch/50 bg-leather-texture shadow-skeuo-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-chalk"
        >
          <span aria-hidden>🍻</span>
          <span className="text-graffiti text-leather-stitch">Enchepaitos</span>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <NavLinks showAdmin={canAdmin(profile)} />
        </nav>

        <div className="flex items-center gap-3">
          {profile ? (
            <>
              <span className="hidden text-sm text-chalk/70 sm:inline">
                {profile.username}
              </span>
              <Badge
                tone={
                  profile.status === "approved"
                    ? "success"
                    : profile.status === "pending"
                      ? "warning"
                      : "danger"
                }
              >
                {profile.status}
              </Badge>
              <form action={signOut}>
                <Button type="submit" variant="ghost" size="sm">
                  Salir
                </Button>
              </form>
            </>
          ) : (
            <>
              <LinkButton href="/login" variant="ghost" size="sm">
                Entrar
              </LinkButton>
              <LinkButton href="/register" size="sm">
                Registrarse
              </LinkButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
