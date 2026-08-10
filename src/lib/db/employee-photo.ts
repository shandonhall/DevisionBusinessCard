import "server-only";

import { createClient } from "@/lib/supabase/server";

export const ALLOWED_PHOTO_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function extensionForMime(mime: string): "png" | "webp" | "jpg" {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

function resolvePhotoMime(file: File): string {
  if (
    ALLOWED_PHOTO_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_PHOTO_MIME_TYPES)[number],
    )
  ) {
    return file.type;
  }

  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";

  if (name.endsWith(".heic") || name.endsWith(".heif") || file.type === "image/heic" || file.type === "image/heif") {
    throw new Error(
      "HEIC photos from iPhone are not supported yet. Export or choose the photo as JPEG, then upload again.",
    );
  }

  throw new Error("Photo must be PNG, JPEG, or WebP.");
}

export async function uploadEmployeeProfilePhoto(params: {
  organisationId: string;
  employeeId: string;
  file: File;
}): Promise<string> {
  if (params.file.size === 0) {
    throw new Error("Choose a photo to upload.");
  }
  if (params.file.size > MAX_PHOTO_BYTES) {
    throw new Error("Photo must be 5MB or smaller.");
  }

  const contentType = resolvePhotoMime(params.file);
  const extension = extensionForMime(contentType);
  const path = `${params.organisationId}/employees/${params.employeeId}/profile-${Date.now()}.${extension}`;
  const supabase = await createClient();
  const buffer = Buffer.from(await params.file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("organisation-assets")
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("organisation-assets").getPublicUrl(path);

  const { data: updated, error: updateError } = await supabase
    .from("employees")
    .update({ profile_photo_url: publicUrl })
    .eq("id", params.employeeId)
    .eq("organisation_id", params.organisationId)
    .select("id, profile_photo_url")
    .maybeSingle();

  if (updateError) {
    throw new Error(updateError.message);
  }
  if (!updated?.profile_photo_url) {
    throw new Error(
      "Photo uploaded, but your profile could not be updated. Ask an admin to link your login on Team, then try again.",
    );
  }

  return updated.profile_photo_url;
}
