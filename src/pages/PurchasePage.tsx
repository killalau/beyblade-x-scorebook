import { FileUpload } from "@/components/file-upload";
import { usePrivateData } from "@/features/private-data/use-private-data";
import { PagePlaceholder } from "@/pages/page-placeholder";

export function PurchasePage() {
  const { collection, loadCollection } = usePrivateData();
  return (
    <PagePlaceholder
      title="Purchase"
      description="Review current owned products, full purchase history, unit prices, sales, returns, and net spend."
      emptyTitle={
        collection
          ? `${collection.data.purchases.items.length} purchase records loaded`
          : "Load your collection"
      }
      emptyDescription={
        collection
          ? "Product cards and history arrive in Phase 6."
          : "Purchase history is stored only in your collection JSON and browser."
      }
      action={
        !collection ? (
          <FileUpload label="Load collection JSON" onFile={loadCollection} />
        ) : undefined
      }
    />
  );
}
