import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { usePublicCatalogue } from "@/features/catalogue/use-public-catalogue";
import { PagePlaceholder } from "@/pages/page-placeholder";

export function CataloguePage() {
  const catalogue = usePublicCatalogue();
  if (catalogue.status === "error")
    return (
      <ErrorState title="Catalogue unavailable" message={catalogue.error} />
    );
  if (catalogue.status === "loading")
    return (
      <div className="grid gap-6" aria-busy="true">
        <PageHeader
          title="Catalogue"
          description="Loading the public retailer snapshot…"
        />
      </div>
    );
  return (
    <PagePlaceholder
      title="Catalogue"
      description="Browse every verified crawled listing, including products that are not currently orderable."
      emptyTitle={`${catalogue.data.items.length} public listings loaded`}
      emptyDescription="Search, filters, all-status sorting, and responsive results arrive in Phase 7."
    />
  );
}
