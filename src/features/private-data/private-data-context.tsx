import { type ReactNode, useCallback, useMemo, useState } from "react";

import { PrivateDataContext } from "@/features/private-data/private-data-state";
import { collectionSchema, wishlistSchema } from "@/schemas/data-schemas";
import {
  clearPrivateData,
  parseJsonFile,
  readPrivateData,
  savePrivateData,
} from "@/storage/private-data";

function initialData<T>(
  kind: "collection" | "wishlist",
  schema: Parameters<typeof readPrivateData<T>>[2],
) {
  if (typeof window === "undefined") return { value: null, error: null };
  const result = readPrivateData(window.localStorage, kind, schema);
  if (result.status === "ready") return { value: result.value, error: null };
  if (result.status === "invalid")
    return { value: null, error: result.message };
  return { value: null, error: null };
}

export function PrivateDataProvider({ children }: { children: ReactNode }) {
  const [initialCollection] = useState(() =>
    initialData("collection", collectionSchema),
  );
  const [initialWishlist] = useState(() =>
    initialData("wishlist", wishlistSchema),
  );
  const [collection, setCollection] = useState(initialCollection.value);
  const [wishlist, setWishlist] = useState(initialWishlist.value);
  const [error, setError] = useState<string | null>(
    initialCollection.error ?? initialWishlist.error,
  );

  const loadCollection = useCallback(async (file: File) => {
    try {
      const data = await parseJsonFile(file, collectionSchema);
      setCollection(
        savePrivateData(window.localStorage, "collection", file.name, data),
      );
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load collection data.",
      );
    }
  }, []);

  const loadWishlist = useCallback(async (file: File) => {
    try {
      const data = await parseJsonFile(file, wishlistSchema);
      setWishlist(
        savePrivateData(window.localStorage, "wishlist", file.name, data),
      );
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load wishlist data.",
      );
    }
  }, []);

  const clear = useCallback(() => {
    clearPrivateData(window.localStorage);
    setCollection(null);
    setWishlist(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      collection,
      wishlist,
      error,
      loadCollection,
      loadWishlist,
      clear,
    }),
    [collection, wishlist, error, loadCollection, loadWishlist, clear],
  );

  return (
    <PrivateDataContext.Provider value={value}>
      {children}
    </PrivateDataContext.Provider>
  );
}
