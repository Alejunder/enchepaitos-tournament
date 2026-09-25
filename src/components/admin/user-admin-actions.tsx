"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  deleteUser,
  updateUserRole,
  updateUserStatus,
} from "@/app/api/actions/auth";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/types";

export function UserAdminActions({
  userId,
  status,
  role,
  isSelf,
}: {
  userId: string;
  status: "pending" | "approved" | "rejected";
  role: "admin" | "player";
  isSelf: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<ActionResult>) {
    startTransition(async () => {
      const result = await action();

      if (!result.success) {
        setError(result.error);
        return;
      }

      setError(null);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!window.confirm("¿Eliminar definitivamente a este usuario?")) {
      return;
    }

    run(() => deleteUser(userId));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "approved" && (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => run(() => updateUserStatus(userId, "approved"))}
        >
          Aprobar
        </Button>
      )}

      {status === "approved" && (
        <Button
          variant="danger"
          size="sm"
          disabled={isPending}
          onClick={() => run(() => updateUserStatus(userId, "rejected"))}
        >
          Revocar
        </Button>
      )}

      {role === "player" ? (
        <Button
          variant="secondary"
          size="sm"
          disabled={isPending}
          onClick={() => run(() => updateUserRole(userId, "admin"))}
        >
          Hacer admin
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          disabled={isPending || isSelf}
          title={isSelf ? "No puedes quitarte el rol a ti mismo" : undefined}
          onClick={() => run(() => updateUserRole(userId, "player"))}
        >
          Quitar admin
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
        disabled={isPending || isSelf}
        title={isSelf ? "No puedes eliminarte a ti mismo" : undefined}
        onClick={handleDelete}
      >
        Eliminar
      </Button>

      {error && <p className="w-full text-xs text-red-400">{error}</p>}
    </div>
  );
}
