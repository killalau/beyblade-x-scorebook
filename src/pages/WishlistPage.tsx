import { FileUpload } from "@/components/file-upload";
import { usePrivateData } from "@/features/private-data/use-private-data";
import { PagePlaceholder } from "@/pages/page-placeholder";

export function WishlistPage() {
  const { wishlist, loadWishlist } = usePrivateData();
  return (
    <PagePlaceholder
      title="Wishlist"
      description="Compare currently orderable listings by useful parts, score, Cost Index, and price."
      emptyTitle={
        wishlist
          ? `${wishlist.data.items.length} wishlist items loaded`
          : "Load your generated wishlist"
      }
      emptyDescription={
        wishlist
          ? "Filters, sorting, card, and list views arrive in Phase 7."
          : "Generate the wishlist locally, then load it here without sending it anywhere."
      }
      action={
        !wishlist ? (
          <FileUpload label="Load wishlist JSON" onFile={loadWishlist} />
        ) : undefined
      }
    />
  );
}
