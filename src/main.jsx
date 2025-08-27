import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "react-hot-toast";
import I18nProvider from "./i18n/I18nProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <I18nProvider>
      <Toaster position="top-center" />
      <App />
    </I18nProvider>
  </StrictMode>
);
