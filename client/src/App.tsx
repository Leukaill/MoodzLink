import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";

// Pages
import Home from "@/pages/home";
import CreatePost from "@/pages/create-post";
import Profile from "@/pages/profile";
import MoodMatch from "@/pages/mood-match";
import DiscoverMatches from "@/pages/discover-matches";
import Matches from "@/pages/matches";
import Chat from "@/pages/chat";
import DailyPhoto from "@/pages/daily-photo";
import AuthCallback from "@/pages/auth-callback";
import AuthVerify from "@/pages/auth-verify";
import Onboarding from "@/pages/onboarding";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create-post" component={CreatePost} />
      <Route path="/profile" component={Profile} />
      <Route path="/mood-match" component={MoodMatch} />
      <Route path="/discover-matches" component={DiscoverMatches} />
      <Route path="/matches" component={Matches} />
      <Route path="/chat/:matchId" component={Chat} />
      <Route path="/daily-photo" component={DailyPhoto} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/auth/verify" component={AuthVerify} />
      <Route path="/onboarding" component={Onboarding} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
