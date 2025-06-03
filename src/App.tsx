import React from "react";
import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import LoginPage from "./pages/LoginPage";
import TransportPage from "./pages/TransportPage";
import DashboardPage from "./pages/DashboardPage";
import { useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

function AuthenticatedApp() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Se încarcă...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900">iTrack GPS</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Salut, {user?.username}!</span>
          <button
            onClick={() => logout()}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Deconectare
          </button>
        </div>
      </div>
      
      <Switch>
        <Route path="/" component={TransportPage} />
        <Route path="/transport" component={TransportPage} />
        <Route path="/dashboard" component={DashboardPage} />
      </Switch>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthenticatedApp />
    </QueryClientProvider>
  );
}