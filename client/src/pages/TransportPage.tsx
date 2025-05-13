import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/MainLayout";
import MobileLayout from "@/components/MobileLayout";
import TransportControls from "@/components/TransportControls";
import LocationTracking from "@/components/LocationTracking";
import { TransportProvider } from "@/context/TransportContext";
import { Capacitor } from "@capacitor/core";

export default function TransportPage() {
  const { isAuthenticated, hasVehicle } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  
  // Detectăm dacă rulăm pe mobil sau pe desktop
  useEffect(() => {
    const isNativePlatform = Capacitor.isNativePlatform();
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(isNativePlatform || isMobileDevice || window.innerWidth < 768);
  }, []);

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

  // Folosim layout-ul potrivit în funcție de platformă
  const Layout = isMobile ? MobileLayout : MainLayout;

  return (
    <TransportProvider>
      <Layout>
        <section>
          <TransportControls />
          <LocationTracking />
        </section>
      </Layout>
    </TransportProvider>
  );
}
