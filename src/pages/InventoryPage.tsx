import { FileUpload } from "@/components/file-upload";
import { usePrivateData } from "@/features/private-data/use-private-data";
import { PagePlaceholder } from "@/pages/page-placeholder";

export function InventoryPage() {
  const { collection, loadCollection } = usePrivateData();
  return (
    <PagePlaceholder
      title="Inventory"
      description="Browse owned parts by category, source, abbreviation, and product line."
      emptyTitle={
        collection
          ? `${collection.data.inventory.parts.length} owned parts loaded`
          : "Load your collection"
      }
      emptyDescription={
        collection
          ? "The full parts table is added in Phase 6."
          : "Your JSON stays in this browser and is never uploaded to a server."
      }
      action={
        !collection ? (
          <FileUpload label="Load collection JSON" onFile={loadCollection} />
        ) : undefined
      }
    />
  );
}
