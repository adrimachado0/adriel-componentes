"use client";

import { env } from "@/lib/env";

export const BUCKET = "product-images";

/** Files bigger than this are rejected before even trying to decode them. */
export const MAX_SOURCE_BYTES = 30 * 1024 * 1024;
/** Must match the bucket's file_size_limit (5 MiB). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_SIDE = 1600;

export type CompressedImage = { blob: Blob; extension: "webp" | "jpg" };

export class ImageError extends Error {}

/**
 * Resizes so the longest side is ≤ 1600px and encodes as WebP (q≈0.8).
 * Browsers that cannot encode WebP fall back to JPEG. EXIF orientation is
 * applied, and the re-encode drops EXIF metadata (GPS, camera…).
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  if (!file.type.startsWith("image/")) {
    throw new ImageError("Ese archivo no es una imagen.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new ImageError("La foto es demasiado grande (máximo 30 MB).");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ImageError("No se pudo leer esa foto. Probá con JPG o PNG.");
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new ImageError("No se pudo procesar la foto.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const toBlob = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, quality),
    );

  let blob = await toBlob("image/webp", 0.8);
  let extension: CompressedImage["extension"] = "webp";
  if (!blob || blob.type !== "image/webp") {
    blob = await toBlob("image/jpeg", 0.85);
    extension = "jpg";
  }
  if (!blob) throw new ImageError("No se pudo procesar la foto.");
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new ImageError(
      "La foto sigue pesando más de 5 MB después de comprimirla.",
    );
  }
  return { blob, extension };
}

/**
 * Uploads straight to Storage with the admin's own session (RLS applies).
 * Uses XHR instead of supabase-js to report upload progress.
 */
export function uploadToStorage({
  blob,
  path,
  accessToken,
  onProgress,
  signal,
}: {
  blob: Blob;
  path: string;
  accessToken: string;
  onProgress: (fraction: number) => void;
  signal?: AbortSignal;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${env.supabaseUrl}/storage/v1/object/${BUCKET}/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("apikey", env.supabaseAnonKey);
    xhr.setRequestHeader("Content-Type", blob.type);
    // Names are unique and never overwritten: cache for a year.
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new ImageError("No se pudo subir la foto."));
    };
    xhr.onerror = () =>
      reject(new ImageError("No se pudo subir la foto. Revisá tu conexión."));
    xhr.onabort = () =>
      reject(new DOMException("Upload aborted", "AbortError"));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(blob);
  });
}
