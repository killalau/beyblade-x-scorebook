import { useContext } from "react";

import {
  PrivateDataContext,
  type PrivateDataContextValue,
} from "@/features/private-data/private-data-state";

export function usePrivateData(): PrivateDataContextValue {
  const context = useContext(PrivateDataContext);
  if (!context)
    throw new Error("usePrivateData must be used inside PrivateDataProvider");
  return context;
}
