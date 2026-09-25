import { getCurrentProfile } from "@/lib/auth";

export async function PendingBanner() {
  const profile = await getCurrentProfile();

  if (!profile || profile.status !== "pending") {
    return null;
  }

  return (
    <div className="border-b border-beer/30 bg-beer/15 px-4 py-2 text-center text-sm font-medium text-beer">
      Tu cuenta está pendiente de validación por el Admin.
    </div>
  );
}
