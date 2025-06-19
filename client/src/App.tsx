import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Chores from "@/pages/Chores";
import Homework from "@/pages/Homework";
import Schedule from "@/pages/Schedule";
import FamilyEvents from "@/pages/FamilyEvents";
import Rewards from "@/pages/Rewards";
import HouseRules from "@/pages/HouseRules";
import ParentAdmin from "@/pages/ParentAdmin";
import FamilyManagement from "@/pages/FamilyManagement";
import Profile from "@/pages/Profile";
import Sidebar from "@/components/Sidebar";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <main className="flex-1 overflow-y-auto">
                <Route path="/" component={Dashboard} />
                <Route path="/chores" component={Chores} />
                <Route path="/homework" component={Homework} />
                <Route path="/schedule" component={Schedule} />
                <Route path="/family-events" component={FamilyEvents} />
                <Route path="/rewards" component={Rewards} />
                <Route path="/house-rules" component={HouseRules} />
                <Route path="/parent-admin" component={ParentAdmin} />
                <Route path="/family-management" component={FamilyManagement} />
                <Route path="/profile" component={Profile} />
              </main>
            </div>
          </div>
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
