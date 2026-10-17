import { type ReactNode, useEffect, useState } from "react";

import {
  PublicCatalogueContext,
  type PublicCatalogueState,
} from "@/features/catalogue/public-catalogue-state";
import {
  formatValidationError,
  publicCatalogueSchema,
} from "@/schemas/data-schemas";

export function PublicCatalogueProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PublicCatalogueState>({
    status: "loading",
    data: null,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const url = `${import.meta.env.BASE_URL}data/retailer-listings.json`;
        const response = await fetch(url, {
          cache: "no-cache",
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error(
            `Catalogue request failed (HTTP ${response.status}).`,
          );
        const result = publicCatalogueSchema.safeParse(await response.json());
        if (!result.success)
          throw new Error(formatValidationError(result.error));
        setState({ status: "ready", data: result.data, error: null });
      } catch (cause) {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          data: null,
          error:
            cause instanceof Error
              ? cause.message
              : "Could not load the public catalogue.",
        });
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  return (
    <PublicCatalogueContext.Provider value={state}>
      {children}
    </PublicCatalogueContext.Provider>
  );
}
