import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PaperPanel } from "@/components/ui/PaperPanel";
import { UserAdminActions } from "@/components/admin/user-admin-actions";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
} as const;

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const currentProfile = await getCurrentProfile();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  const users = (profiles ?? []) as Profile[];
  const pending = users.filter((user) => user.status === "pending");

  return (
    <div className="space-y-8">
      <PaperPanel>
        <h1 className="text-graffiti text-2xl font-bold text-ink">
          Gestión de usuarios
        </h1>
        <p className="mt-1 text-sm text-ink/75">
          Aprueba, cambia roles o elimina usuarios.
        </p>
      </PaperPanel>

      <section className="space-y-3">
        <PaperPanel className="inline-block px-4 py-2">
          <h2 className="text-graffiti text-lg font-bold text-ink">
            Pendientes ({pending.length})
          </h2>
        </PaperPanel>
        {pending.length === 0 ? (
          <PaperPanel>
            <p className="text-sm text-ink/75">No hay solicitudes pendientes.</p>
          </PaperPanel>
        ) : (
          <Card className="divide-y divide-leather-stitch/30 p-0">
            {pending.map((user) => (
              <div
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="font-medium text-chalk">{user.username}</p>
                  <p className="text-xs text-chalk/50">
                    {user.email} · {formatDate(user.created_at)}
                  </p>
                </div>
                <UserAdminActions
                  userId={user.id}
                  status={user.status}
                  role={user.role}
                  isSelf={user.id === currentProfile?.id}
                />
              </div>
            ))}
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <PaperPanel className="inline-block px-4 py-2">
          <h2 className="text-graffiti text-lg font-bold text-ink">
            Todos los usuarios
          </h2>
        </PaperPanel>
        <Card className="divide-y divide-leather-stitch/30 p-0">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="font-medium text-chalk">{user.username}</p>
                <p className="text-xs text-chalk/50">{user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={STATUS_TONE[user.status]}>
                  {user.status === "approved"
                    ? "aprobado"
                    : user.status === "pending"
                      ? "pendiente"
                      : "rechazado"}
                </Badge>
                {user.role === "admin" && <Badge tone="info">admin</Badge>}
                <UserAdminActions
                  userId={user.id}
                  status={user.status}
                  role={user.role}
                  isSelf={user.id === currentProfile?.id}
                />
              </div>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
