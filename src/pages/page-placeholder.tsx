import type { ReactNode } from "react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

type Props = {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  action?: ReactNode;
};

export function PagePlaceholder({
  title,
  description,
  emptyTitle,
  emptyDescription,
  action,
}: Props) {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="React migration"
        title={title}
        description={description}
      />
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={action}
      />
    </div>
  );
}
