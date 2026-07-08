import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { hydrateThemeFromSettings } from "./stores/useThemeStore";
import "./index.css";

void hydrateThemeFromSettings();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
