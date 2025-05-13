import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/MainLayout";
import TransportControls from "@/components/TransportControls";
import LocationTracking from "@/components/LocationTracking";
import { TransportProvider } from "@/context/TransportContext";

export default function TransportPage() {
  const { isAuthenticated, hasVehicle } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not authenticated or doesn't have a vehicle
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/');
    } else if (!hasVehicle) {
      setLocation('/vehicle');
    }
  }, [isAuthenticated, hasVehicle, setLocation]);

  // Only render page if authenticated and has a vehicle
  if (!isAuthenticated || !hasVehicle) {
    return null;
  }

  return (
    <MainLayout>
      <TransportProvider>
        <section>
          <TransportControls />
          <LocationTracking />
        </section>
      </TransportProvider>
    </MainLayout>
  );
}
