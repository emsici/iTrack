import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { AuthProvider } from "@/context/AuthContext";
import LoginPage from "@/pages/LoginPage";
import VehicleInputPage from "@/pages/VehicleInputPage";
import TransportPage from "@/pages/TransportPage";
import AboutPage from "@/pages/AboutPage";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/vehicle" component={VehicleInputPage} />
      <Route path="/transport" component={TransportPage} />
      <Route path="/about" component={AboutPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;
