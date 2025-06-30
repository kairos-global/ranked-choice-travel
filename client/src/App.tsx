import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import LoadingScreen from "@/components/loading-screen";
import CertificationSticker from "@/components/certification-sticker";
import Home from "@/pages/home";
import Poll from "@/pages/poll";
import Results from "@/pages/results";

function Router() {
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/poll/:id" component={Poll} />
        <Route path="/results/:id" component={Results} />
        <Route>
          <div className="retro-desktop">
            <div className="retro-window">
              <div className="retro-window-header">
                <div>TripPoll 95 - Error</div>
              </div>
              <div className="retro-window-content">
                <div className="retro-logo">404 - Page Not Found</div>
                <p style={{ color: 'black' }}>The requested page could not be found.</p>
              </div>
            </div>
          </div>
        </Route>
      </Switch>
      <CertificationSticker />
    </>
  );
}

function App() {
  const [showLoading, setShowLoading] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {showLoading ? (
          <LoadingScreen onComplete={() => setShowLoading(false)} />
        ) : (
          <Router />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
