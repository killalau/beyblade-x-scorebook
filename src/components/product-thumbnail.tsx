import { useState } from "react";

import { cn } from "@/lib/utils";

type ProductThumbnailProps = {
  imageUrl?: string;
  name: string;
  className?: string;
};

export function ProductThumbnail({
  imageUrl,
  name,
  className,
}: ProductThumbnailProps) {
  const [failedUrl, setFailedUrl] = useState<string>();

  return (
    <span
      className={cn(
        "grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary text-xs font-black text-primary",
        className,
      )}
    >
      {imageUrl && failedUrl !== imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="size-full object-contain"
          onError={() => setFailedUrl(imageUrl)}
        />
      ) : (
        <span aria-label={`${name} image unavailable`}>BX</span>
      )}
    </span>
  );
}
