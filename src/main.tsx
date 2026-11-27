import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ProgressProvider } from "./store";
import { ErrorBoundary } from "./components/ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <ProgressProvider>
      <App />
    </ProgressProvider>
  </ErrorBoundary>,
);
