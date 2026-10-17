import { createContext } from "react";

import type { PublicCatalogueInput } from "@/schemas/data-schemas";

export type PublicCatalogueState =
  | { status: "loading"; data: null; error: null }
  | { status: "ready"; data: PublicCatalogueInput; error: null }
  | { status: "error"; data: null; error: string };

export const PublicCatalogueContext =
  createContext<PublicCatalogueState | null>(null);
