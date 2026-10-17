import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";

import { App } from "./app/App";
import "./app/foundation.css";

const root = document.querySelector<HTMLDivElement>("#root");

if (!root) {
  throw new Error("React root element was not found.");
}

createRoot(root).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
