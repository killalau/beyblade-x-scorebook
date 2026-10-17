import { useContext } from "react";

import {
  PublicCatalogueContext,
  type PublicCatalogueState,
} from "@/features/catalogue/public-catalogue-state";

export function usePublicCatalogue(): PublicCatalogueState {
  const context = useContext(PublicCatalogueContext);
  if (!context)
    throw new Error(
      "usePublicCatalogue must be used inside PublicCatalogueProvider",
    );
  return context;
}
