import type { ActionResult, Profile } from "@/types";

export const UNAUTHORIZED = {
  success: false,
  error: "No autorizado.",
  code: "UNAUTHORIZED",
} as const satisfies ActionResult;

export const UNAUTHORIZED_PENDING_APPROVAL = {
  success: false,
  error: "Tu cuenta está pendiente de validación por el Admin.",
  code: "UNAUTHORIZED_PENDING_APPROVAL",
} as const satisfies ActionResult;

export const NOT_ADMIN = {
  success: false,
  error: "Se requieren permisos de administrador.",
  code: "NOT_ADMIN",
} as const satisfies ActionResult;

export function canWrite(profile: Pick<Profile, "status"> | null): boolean {
  return profile?.status === "approved";
}

export function canAdmin(profile: Pick<Profile, "role"> | null): boolean {
  return profile?.role === "admin";
}
