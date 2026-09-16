import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";

export default function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster position="bottom-right" toastOptions={{ classNames: { toast: "border-border bg-card text-card-foreground" } }} />
        <Home />
      </TooltipProvider>
    </ErrorBoundary>
  );
}
