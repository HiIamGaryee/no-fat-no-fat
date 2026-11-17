import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ErrorBoundary } from "./components/app/ErrorBoundary";
import "./styles/globals.css";
import { I18nProvider } from "./i18n/config";
import { loadSettings } from "./lib/storage";

const accessibilitySettings=loadSettings();
document.documentElement.classList.toggle("user-reduced-motion",accessibilitySettings.reducedMotion);
document.documentElement.classList.toggle("high-readability",accessibilitySettings.highReadability);

createRoot(document.getElementById("root")!).render(
  <StrictMode><BrowserRouter><I18nProvider><ErrorBoundary><App /></ErrorBoundary></I18nProvider></BrowserRouter></StrictMode>,
);
