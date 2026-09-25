"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/auth";
import { canAdmin } from "@/lib/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { validateRegisterInput, type RegisterInput } from "@/lib/validation";
import type { ActionResult, UserRole, UserStatus } from "@/types";

export async function registerUser(
  input: RegisterInput,
): Promise<ActionResult<{ status: "PENDING_APPROVAL" }>> {
  const validationError = validateRegisterInput(input);
  if (validationError) {
    return { success: false, error: validationError, code: "VALIDATION_ERROR" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: { username: input.username.trim() },
    },
  });

  if (error) {
    return { success: false, error: error.message, code: "CONFLICT" };
  }

  return { success: true, data: { status: "PENDING_APPROVAL" } };
}

export async function signIn(
  email: string,
  password: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message = error.message.toLowerCase().includes("email not confirmed")
      ? "Tu cuenta aún no está confirmada. Pide al admin que la valide."
      : error.message;
    return { success: false, error: message, code: "UNAUTHORIZED" };
  }

  revalidatePath("/", "layout");
  return { success: true, data: null };
}

export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateUserStatus(
  userId: string,
  newStatus: Extract<UserStatus, "approved" | "rejected">,
): Promise<ActionResult> {
  const profile = await getCurrentProfile();

  if (!profile) {
    return { success: false, error: "No autorizado.", code: "UNAUTHORIZED" };
  }

  if (!canAdmin(profile)) {
    return {
      success: false,
      error: "Se requieren permisos de administrador.",
      code: "NOT_ADMIN",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ status: newStatus })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message, code: "UNKNOWN" };
  }

  // Al aprobar, confirmamos el email en Auth para que pueda iniciar sesión
  // aunque la confirmación por correo esté activada en el proyecto.
  if (newStatus === "approved") {
    const admin = createAdminClient();
    const { error: confirmError } = await admin.auth.admin.updateUserById(
      userId,
      { email_confirm: true },
    );

    if (confirmError) {
      return { success: false, error: confirmError.message, code: "UNKNOWN" };
    }
  }

  revalidatePath("/admin/users");
  revalidatePath("/", "layout");

  return { success: true, data: null };
}

export async function updateUserRole(
  userId: string,
  role: UserRole,
): Promise<ActionResult> {
  const profile = await getCurrentProfile();

  if (!profile) {
    return { success: false, error: "No autorizado.", code: "UNAUTHORIZED" };
  }

  if (!canAdmin(profile)) {
    return {
      success: false,
      error: "Se requieren permisos de administrador.",
      code: "NOT_ADMIN",
    };
  }

  if (profile.id === userId && role !== "admin") {
    return {
      success: false,
      error: "No puedes quitarte a ti mismo el rol de administrador.",
      code: "VALIDATION_ERROR",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message, code: "UNKNOWN" };
  }

  revalidatePath("/admin/users");
  revalidatePath("/", "layout");

  return { success: true, data: null };
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();

  if (!profile) {
    return { success: false, error: "No autorizado.", code: "UNAUTHORIZED" };
  }

  if (!canAdmin(profile)) {
    return {
      success: false,
      error: "Se requieren permisos de administrador.",
      code: "NOT_ADMIN",
    };
  }

  if (profile.id === userId) {
    return {
      success: false,
      error: "No puedes eliminar tu propia cuenta.",
      code: "VALIDATION_ERROR",
    };
  }

  const admin = createAdminClient();

  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    return { success: false, error: error.message, code: "UNKNOWN" };
  }

  revalidatePath("/admin/users");
  revalidatePath("/", "layout");

  return { success: true, data: null };
}
