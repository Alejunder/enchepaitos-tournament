"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { registerUser } from "@/app/api/actions/auth";
import { Button, LinkButton } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleSubmit(formData: FormData) {
    const input = {
      username: String(formData.get("username") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    };

    startTransition(async () => {
      const result = await registerUser(input);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setError(null);
      setDone(true);
    });
  }

  if (done) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Solicitud enviada</CardTitle>
          <CardDescription>
            Tu cuenta está pendiente de validación por el Admin. Te avisaremos
            cuando puedas participar.
          </CardDescription>
        </CardHeader>
        <LinkButton href="/" variant="secondary" className="w-full">
          Volver al inicio
        </LinkButton>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear cuenta</CardTitle>
        <CardDescription>
          Tu cuenta quedará pendiente de aprobación del Admin.
        </CardDescription>
      </CardHeader>

      <form action={handleSubmit} className="space-y-4">
        <Input
          name="username"
          placeholder="Usuario"
          required
          minLength={3}
          maxLength={20}
          pattern="[A-Za-z0-9]{3,20}"
          autoComplete="username"
        />
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
          placeholder="Contraseña (mín. 8 caracteres)"
          required
          minLength={8}
          autoComplete="new-password"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Enviando..." : "Solicitar acceso"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-chalk/60">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-emerald-600 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </Card>
  );
}
