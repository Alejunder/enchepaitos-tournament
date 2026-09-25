import Link from "next/link";

import { PendingBanner } from "@/components/layout/pending-banner";
import { SiteHeader } from "@/components/layout/site-header";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <PendingBanner />
      <SiteHeader />
      <div className="border-b border-leather-stitch/40 bg-black/30">
        <nav className="mx-auto flex max-w-6xl gap-6 px-4 py-2 text-sm">
          <Link href="/admin/users" className="font-medium text-chalk">
            Usuarios
          </Link>
          <Link href="/admin/tournaments" className="text-chalk/60 hover:text-chalk">
            Torneos
          </Link>
        </nav>
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
