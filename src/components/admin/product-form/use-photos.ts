"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import {
  BUCKET,
  compressImage,
  ImageError,
  uploadToStorage,
} from "@/lib/images/client";
import { productImageUrl } from "@/lib/site";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { MAX_PHOTOS } from "@/lib/validation/product";

export type Photo = {
  key: string;
  /** Storage path once uploaded (or for photos that were already saved). */
  path: string | null;
  /** Object URL (new photos) or public URL (saved photos). */
  preview: string;
  status: "uploading" | "done" | "error";
  progress: number;
  error?: string;
  /** Uploaded in this visit to the form and not saved yet. */
  unsaved: boolean;
};

/**
 * Photo list state for the product form: compress + upload new files,
 * reorder, remove, and clean up uploads that end up not being saved.
 */
export function usePhotos(
  initialPaths: readonly string[],
  onError: (message: string) => void,
) {
  const [photos, setPhotos] = useState<Photo[]>(() =>
    initialPaths.map((path) => ({
      key: path,
      path,
      preview: productImageUrl(path),
      status: "done",
      progress: 1,
      unsaved: false,
    })),
  );
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  const supabaseRef = useRef<ReturnType<typeof createBrowserSupabase> | null>(
    null,
  );
  const supabase = useCallback(() => {
    supabaseRef.current ??= createBrowserSupabase();
    return supabaseRef.current;
  }, []);

  const update = useCallback((key: string, patch: Partial<Photo>) => {
    setPhotos((list) =>
      list.map((p) => (p.key === key ? { ...p, ...patch } : p)),
    );
  }, []);

  const addFiles = useCallback(
    async (files: File[]) => {
      const free = MAX_PHOTOS - photosRef.current.length;
      if (files.length === 0) return;
      if (free <= 0) {
        onError(
          `Ya tenés ${MAX_PHOTOS} fotos. Quitá alguna para agregar otra.`,
        );
        return;
      }
      if (files.length > free) {
        onError(`Podés subir hasta ${MAX_PHOTOS} fotos: se agregaron ${free}.`);
      }
      const accepted = files.slice(0, free);
      const items: Photo[] = accepted.map((file) => ({
        key: crypto.randomUUID(),
        path: null,
        preview: URL.createObjectURL(file),
        status: "uploading",
        progress: 0,
        unsaved: true,
      }));
      setPhotos((list) => [...list, ...items]);

      const { data } = await supabase().auth.getSession();
      const accessToken = data.session?.access_token;

      await Promise.all(
        items.map(async (item, index) => {
          const file = accepted[index];
          try {
            if (!accessToken || !file) {
              throw new ImageError("Tu sesión venció. Volvé a iniciar sesión.");
            }
            const { blob, extension } = await compressImage(file);
            const path = `products/${crypto.randomUUID()}.${extension}`;
            await uploadToStorage({
              blob,
              path,
              accessToken,
              onProgress: (progress) => update(item.key, { progress }),
            });
            update(item.key, { status: "done", path, progress: 1 });
          } catch (error) {
            const message =
              error instanceof ImageError
                ? error.message
                : "No se pudo subir la foto.";
            update(item.key, { status: "error", error: message });
            onError(message);
          }
        }),
      );
    },
    [onError, supabase, update],
  );

  const removeFromStorage = useCallback(
    (paths: string[]) => {
      if (paths.length === 0) return;
      // Best effort: an orphan file is harmless, so failures are only logged.
      void supabase()
        .storage.from(BUCKET)
        .remove(paths)
        .then(({ error }) => {
          if (error) console.error("Could not remove uploads", error);
        });
    },
    [supabase],
  );

  const remove = useCallback(
    (key: string) => {
      const photo = photosRef.current.find((p) => p.key === key);
      if (!photo) return;
      // Saved photos are deleted from Storage by the server when the form is
      // saved; photos uploaded now (and never saved) are deleted right away.
      if (photo.unsaved && photo.path) removeFromStorage([photo.path]);
      if (photo.preview.startsWith("blob:")) URL.revokeObjectURL(photo.preview);
      setPhotos((list) => list.filter((p) => p.key !== key));
    },
    [removeFromStorage],
  );

  const move = useCallback((activeKey: string, overKey: string) => {
    setPhotos((list) => {
      const from = list.findIndex((p) => p.key === activeKey);
      const to = list.findIndex((p) => p.key === overKey);
      return from < 0 || to < 0 ? list : arrayMove(list, from, to);
    });
  }, []);

  /** Cancel: delete everything uploaded in this visit. */
  const discardUnsaved = useCallback(() => {
    removeFromStorage(
      photosRef.current.flatMap((p) => (p.unsaved && p.path ? [p.path] : [])),
    );
  }, [removeFromStorage]);

  /** After a successful save the new uploads belong to the product. */
  const markSaved = useCallback(() => {
    setPhotos((list) => list.map((p) => ({ ...p, unsaved: false })));
  }, []);

  // Free object URLs when leaving the form.
  useEffect(
    () => () => {
      for (const p of photosRef.current) {
        if (p.preview.startsWith("blob:")) URL.revokeObjectURL(p.preview);
      }
    },
    [],
  );

  const paths = useMemo(
    () =>
      photos.flatMap((p) => (p.status === "done" && p.path ? [p.path] : [])),
    [photos],
  );
  const uploading = photos.some((p) => p.status === "uploading");

  return {
    photos,
    paths,
    uploading,
    addFiles,
    remove,
    move,
    discardUnsaved,
    markSaved,
  };
}

export type PhotosController = ReturnType<typeof usePhotos>;
