import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export const PUSKAS_BUCKET = "puskas-videos";
export const COVERS_BUCKET = "tournament-covers";
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_COVER_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export function isAllowedVideoType(type: string): boolean {
  return (ALLOWED_VIDEO_TYPES as readonly string[]).includes(type);
}

export function buildPuskasStoragePath(params: {
  tournamentId: string;
  matchId: string;
  userId: string;
  timestamp?: number;
}): string {
  const { tournamentId, matchId, userId, timestamp = Date.now() } = params;

  return `puskas/${tournamentId}/${matchId}_${userId}_${timestamp}.mp4`;
}

export async function uploadPuskasVideo(
  supabase: SupabaseClient<Database>,
  file: File,
  params: { tournamentId: string; matchId: string; userId: string },
): Promise<{ path: string } | { error: string }> {
  if (!isAllowedVideoType(file.type)) {
    return { error: "UNSUPPORTED_VIDEO_TYPE" };
  }

  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    return { error: "VIDEO_TOO_LARGE" };
  }

  const path = buildPuskasStoragePath({ ...params, timestamp: Date.now() });

  const { error } = await supabase.storage
    .from(PUSKAS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    return { error: error.message };
  }

  return { path };
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function isAllowedImageType(type: string): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}

export async function uploadCoverImage(
  supabase: SupabaseClient<Database>,
  file: File,
): Promise<{ url: string } | { error: string }> {
  if (!isAllowedImageType(file.type)) {
    return { error: "UNSUPPORTED_IMAGE_TYPE" };
  }

  if (file.size > MAX_COVER_SIZE_BYTES) {
    return { error: "IMAGE_TOO_LARGE" };
  }

  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `covers/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(COVERS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    return { error: error.message };
  }

  const url = supabase.storage.from(COVERS_BUCKET).getPublicUrl(path).data.publicUrl;

  return { url };
}
