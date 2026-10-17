import { createContext } from "react";

import type { CollectionInput, WishlistInput } from "@/schemas/data-schemas";
import type { StoredPrivateData } from "@/storage/private-data";

export type PrivateDataContextValue = {
  collection: StoredPrivateData<CollectionInput> | null;
  wishlist: StoredPrivateData<WishlistInput> | null;
  error: string | null;
  loadCollection(file: File): Promise<void>;
  loadWishlist(file: File): Promise<void>;
  clear(): void;
};

export const PrivateDataContext = createContext<PrivateDataContextValue | null>(
  null,
);
