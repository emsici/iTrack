import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/MainLayout";
import MobileLayout from "@/components/MobileLayout";
import TransportControls from "@/components/TransportControls";
import LocationTracking from "@/components/LocationTracking";
import ConnectivityAlert from "@/components/ConnectivityAlert";
import TransportMap from "@/components/TransportMap";
import TransportStats from "@/components/TransportStats";
import VoiceNotifications from "@/components/VoiceNotifications";
import AudioTest from "@/components/AudioTest";
import { TransportProvider } from "@/context/TransportContext";
import { Capacitor } from "@capacitor/core";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        <section className="p-4 space-y-4">
          <ConnectivityAlert />
          <TransportControls />
          
          {/* Informații GPS afișate mereu */}
          <LocationTracking />
          
          {/* Folosim tabs pentru a organiza componentele noi în interfața mobilă */}
          <Tabs defaultValue="map" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="map">Hartă</TabsTrigger>
              <TabsTrigger value="stats">Statistici</TabsTrigger>
            </TabsList>
            
            <TabsContent value="map" className="space-y-4 pt-2">
              <TransportMap />
            </TabsContent>
            
            <TabsContent value="stats" className="space-y-4 pt-2">
              <TransportStats />
              <div className="mt-4">
                <VoiceNotifications />
                <AudioTest />
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </Layout>
    </TransportProvider>
  );
}
