import Image from "next/image";
import { ImagePlaceholderIcon } from "@/components/icons";
import { productImageUrl } from "@/lib/site";

type ProductPhotoProps = {
  /** Storage path, or undefined when the product has no photos. */
  path: string | undefined;
  alt: string;
  /** `sizes` for next/image, matching the rendered width. */
  sizes: string;
  /** Classes for the placeholder icon (size). */
  placeholderClassName?: string;
  preload?: boolean;
};

/**
 * Fills its (relative, sized) parent with the product photo, or with the
 * generic image icon over the light-blue gradient when there is none.
 * The parent provides aspect ratio, radius and the bg-photo background.
 */
export function ProductPhoto({
  path,
  alt,
  sizes,
  placeholderClassName = "size-[72px]",
  preload = false,
}: ProductPhotoProps) {
  if (!path) {
    return (
      <span className="absolute inset-0 flex items-center justify-center text-primary">
        <ImagePlaceholderIcon className={placeholderClassName} />
      </span>
    );
  }

  return (
    <Image
      src={productImageUrl(path)}
      alt={alt}
      fill
      sizes={sizes}
      preload={preload}
      className="object-contain"
    />
  );
}
