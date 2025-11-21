import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Editor from "@/pages/editor";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Editor} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Enable dark mode by default
    document.documentElement.classList.add("dark");
    console.log(`🌙 Dark mode enabled`);
    
    // Log app initialization
    console.log(`📱 App initialization started`);
    console.log(`  Platform: ${navigator.platform}`);
    console.log(`  Language: ${navigator.language}`);
    console.log(`  Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    console.log(`  Screen: ${window.innerWidth}x${window.innerHeight}`);
    console.log(`  Environment: browser`);
    
    // Check for required APIs
    console.log(`🔍 Checking required APIs:`);
    console.log(`  - AudioContext: ${!!window.AudioContext ? '✓' : '✗'}`);
    console.log(`  - AudioBuffer: ${!!window.AudioBuffer ? '✓' : '✗'}`);
    console.log(`  - OfflineAudioContext: ${!!window.OfflineAudioContext ? '✓' : '✗'}`);
    console.log(`  - File API: ${!!window.File ? '✓' : '✗'}`);
    
    const handleResize = () => {
      console.info(`📐 Window resized to ${window.innerWidth}x${window.innerHeight}`);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      console.log(`🛑 App cleanup completed`);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
