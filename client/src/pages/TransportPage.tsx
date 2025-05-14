import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useTransport } from "@/context/TransportContext";
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
          
          {/* Obținem starea transportului pentru a decide ce componente să afișăm */}
          <TransportComponentsWrapper />
        </section>
      </Layout>
    </TransportProvider>
  );
}

// Componentă nouă pentru a gestiona afișarea condițională a componentelor de transport
function TransportComponentsWrapper() {
  const { transportStatus } = useTransport();
  const isTransportActive = transportStatus === "active" || transportStatus === "paused";
  
  // Dacă nu există un transport activ, afișăm doar un mesaj
  if (!isTransportActive) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 text-center">
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          Transport inactiv
        </h3>
        <p className="text-gray-600">
          Începeți un transport pentru a vedea traseul pe hartă și informațiile GPS.
        </p>
      </div>
    );
  }
  
  // Dacă există un transport activ, afișăm toate componentele
  return (
    <>
      {/* Informații GPS afișate doar când există un transport activ */}
      <LocationTracking />
      
      {/* Folosim tabs pentru a organiza componentele noi într-o interfață îmbunătățită */}
      <Tabs defaultValue="map" className="w-full">
        <TabsList className="w-full grid grid-cols-2 rounded-xl bg-gray-100 p-1">
          <TabsTrigger value="map" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-gray-600 font-medium">
            Hartă
          </TabsTrigger>
          <TabsTrigger value="stats" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-gray-600 font-medium">
            Statistici
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="map" className="space-y-4 pt-4 animate-in fade-in-50">
          <div className="bg-white rounded-xl shadow-md p-4 transition-all">
            <TransportMap />
          </div>
        </TabsContent>
        
        <TabsContent value="stats" className="space-y-4 pt-4 animate-in fade-in-50">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <TransportStats />
          </div>
          <div className="mt-6 space-y-4">
            <VoiceNotifications />
            <AudioTest />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
