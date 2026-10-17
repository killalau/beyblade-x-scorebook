import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";

import { App } from "./app/App";
import "./app/globals.css";
import { PublicCatalogueProvider } from "./features/catalogue/public-catalogue-context";
import { PrivateDataProvider } from "./features/private-data/private-data-context";

const root = document.querySelector<HTMLDivElement>("#root");

if (!root) {
  throw new Error("React root element was not found.");
}

createRoot(root).render(
  <StrictMode>
    <HashRouter>
      <PrivateDataProvider>
        <PublicCatalogueProvider>
          <App />
        </PublicCatalogueProvider>
      </PrivateDataProvider>
    </HashRouter>
  </StrictMode>,
);
