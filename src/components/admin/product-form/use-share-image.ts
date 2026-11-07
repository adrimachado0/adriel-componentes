"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BUCKET,
  compressImage,
  ImageError,
  uploadToStorage,
} from "@/lib/images/client";
import { productImageUrl } from "@/lib/site";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export type ShareImage = {
  path: string | null;
  preview: string;
  status: "uploading" | "done" | "error";
  progress: number;
  /** Uploaded in this visit and not saved yet (deleted if the form is left). */
  unsaved: boolean;
  width?: number;
  height?: number;
};

/**
 * The optional Open Graph image of a product (one file). Same rules as the
 * photos: compressed in the browser, uploaded straight to Storage, and an
 * upload that never gets saved is deleted when it is replaced or the form is left.
 */
export function useShareImage(
  initialPath: string | null,
  onError: (message: string) => void,
) {
  const [image, setImage] = useState<ShareImage | null>(() =>
    initialPath
      ? {
          path: initialPath,
          preview: productImageUrl(initialPath),
          status: "done",
          progress: 1,
          unsaved: false,
        }
      : null,
  );
  const imageRef = useRef(image);
  useEffect(() => {
    imageRef.current = image;
  }, [image]);
  const savedRef = useRef(false);
  const leftRef = useRef(false);

  const supabaseRef = useRef<ReturnType<typeof createBrowserSupabase> | null>(
    null,
  );
  const supabase = useCallback(() => {
    supabaseRef.current ??= createBrowserSupabase();
    return supabaseRef.current;
  }, []);

  const discard = useCallback(
    (current: ShareImage | null) => {
      if (!current) return;
      if (current.unsaved && current.path && !savedRef.current) {
        void supabase().storage.from(BUCKET).remove([current.path]);
      }
      if (current.preview.startsWith("blob:"))
        URL.revokeObjectURL(current.preview);
    },
    [supabase],
  );

  const setFile = useCallback(
    async (file: File) => {
      discard(imageRef.current);
      const preview = URL.createObjectURL(file);
      setImage({
        path: null,
        preview,
        status: "uploading",
        progress: 0,
        unsaved: true,
      });
      try {
        const { data } = await supabase().auth.getSession();
        const accessToken = data.session?.access_token;
        if (!accessToken)
          throw new ImageError("Tu sesión venció. Volvé a iniciar sesión.");
        const { blob, extension, width, height } = await compressImage(file);
        const path = `products/${crypto.randomUUID()}.${extension}`;
        await uploadToStorage({
          blob,
          path,
          accessToken,
          onProgress: (progress) =>
            setImage((img) =>
              img?.preview === preview ? { ...img, progress } : img,
            ),
        });
        if (leftRef.current && !savedRef.current) {
          void supabase().storage.from(BUCKET).remove([path]);
          return;
        }
        setImage((img) =>
          img?.preview === preview
            ? { ...img, path, status: "done", progress: 1, width, height }
            : img,
        );
      } catch (error) {
        const message =
          error instanceof ImageError
            ? error.message
            : "No se pudo subir la imagen.";
        setImage((img) =>
          img?.preview === preview ? { ...img, status: "error" } : img,
        );
        onError(message);
      }
    },
    [discard, onError, supabase],
  );

  /** Quitar: back to "use the cover". A saved image is deleted on save. */
  const clear = useCallback(() => {
    discard(imageRef.current);
    setImage(null);
  }, [discard]);

  const markSaved = useCallback(() => {
    savedRef.current = true;
  }, []);

  useEffect(() => {
    leftRef.current = false;
    return () => {
      leftRef.current = true;
      discard(imageRef.current);
    };
  }, [discard]);

  return {
    image,
    path: image?.status === "done" ? image.path : null,
    uploading: image?.status === "uploading",
    setFile,
    clear,
    markSaved,
  };
}

export type ShareImageController = ReturnType<typeof useShareImage>;
