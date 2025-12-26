import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { WeightUnitProvider } from "@/hooks/useWeightUnit";
import { WorkoutProvider } from "@/hooks/useWorkout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Exercises from "./pages/Exercises";
import Routines from "./pages/Routines";
import Analytics from "./pages/Analytics";
import WorkoutLog from "./pages/WorkoutLog";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WeightUnitProvider>
        <WorkoutProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/exercises" element={<Exercises />} />
                <Route path="/routines" element={<Routines />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/workout-log" element={<WorkoutLog />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </WorkoutProvider>
      </WeightUnitProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
