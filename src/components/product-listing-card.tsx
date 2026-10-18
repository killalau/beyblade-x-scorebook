import type { ReactNode } from "react";

import { ProductThumbnail } from "@/components/product-thumbnail";
import { Card, CardContent } from "@/components/ui/card";

export function ProductListingCard({
  name,
  imageUrl,
  href,
  meta,
  children,
}: {
  name: string;
  imageUrl?: string;
  href?: string;
  meta?: ReactNode;
  children?: ReactNode;
}) {
  const content = (
    <Card className="h-full transition-transform hover:-translate-y-0.5">
      <CardContent className="grid h-full grid-cols-[auto_minmax(0,1fr)] gap-4 p-4">
        <ProductThumbnail name={name} imageUrl={imageUrl} />
        <div className="min-w-0">
          <h2 className="font-extrabold text-pretty">{name}</h2>
          {meta && (
            <div className="mt-1 text-sm text-muted-foreground">{meta}</div>
          )}
          {children && <div className="mt-3">{children}</div>}
        </div>
      </CardContent>
    </Card>
  );
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="block h-full no-underline"
    >
      {content}
    </a>
  ) : (
    content
  );
}
