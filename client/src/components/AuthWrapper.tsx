import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

interface AuthWrapperProps {
  children: ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { isAuthenticated, hasVehicle } = useAuth();
  const [location, setLocation] = useLocation();

  // Handle redirection based on authentication state
  if (!isAuthenticated && location !== "/") {
    setLocation("/");
    return null;
  } else if (isAuthenticated && !hasVehicle && location !== "/vehicle") {
    setLocation("/vehicle");
    return null;
  } else if (isAuthenticated && hasVehicle && location === "/") {
    setLocation("/transport");
    return null;
  }

  return <>{children}</>;
}