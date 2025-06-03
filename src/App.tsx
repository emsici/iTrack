import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router, Route, Switch } from 'wouter';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TransportPage from './pages/TransportPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 3,
      queryFn: async ({ queryKey }) => {
        const response = await fetch(queryKey[0] as string);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      },
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <Router>
          <Switch>
            <Route path="/" component={LoginPage} />
            <Route path="/dashboard" component={DashboardPage} />
            <Route path="/transport" component={TransportPage} />
          </Switch>
        </Router>
      </div>
    </QueryClientProvider>
  );
}