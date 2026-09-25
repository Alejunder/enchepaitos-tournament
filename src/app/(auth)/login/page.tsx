"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { signIn } from "@/app/api/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      const result = await signIn(email, password);

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push("/");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>
          Accede con tu cuenta aprobada por el Admin.
        </CardDescription>
      </CardHeader>

      <form action={handleSubmit} className="space-y-4">
        <Input
          name="email"
          type="email"
          placeholder="tu@email.com"
          required
          autoComplete="email"
        />
        <Input
          name="password"
          type="password"
          placeholder="Contraseña"
          required
          autoComplete="current-password"
          minLength={8}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-chalk/60">
        ¿Sin cuenta?{" "}
        <Link href="/register" className="text-emerald-600 hover:underline">
          Solicita acceso
        </Link>
      </p>
    </Card>
  );
}
