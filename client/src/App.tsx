import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import VehicleInputPage from "@/pages/VehicleInputPage";
import TransportPage from "@/pages/TransportPage";
import { useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Se încarcă...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={LandingPage} />
          <Route path="/login" component={LoginPage} />
        </>
      ) : !user?.vehicleRegistered ? (
        <Route path="*" component={VehicleInputPage} />
      ) : (
        <>
          <Route path="/" component={TransportPage} />
          <Route path="/transports" component={TransportPage} />
        </>
      )}
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <Router />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}