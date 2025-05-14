import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useTransport } from "@/context/TransportContext";
import MainLayout from "@/components/MainLayout";
import MobileLayout from "@/components/MobileLayout";
import TransportControls from "@/components/TransportControls";
import SimpleLocationTracking from "@/components/SimpleLocationTracking";
import ConnectivityAlert from "@/components/ConnectivityAlert";
import TransportMap from "@/components/TransportMap";
import TransportStats from "@/components/TransportStats";
import VoiceNotifications from "@/components/VoiceNotifications";
import AudioTest from "@/components/AudioTest";
import { TransportProvider } from "@/context/TransportContext";
import { AboutDialog } from "@/components/AboutDialog";
import { Capacitor } from "@capacitor/core";

export default function TransportPage() {
  const { isAuthenticated, hasVehicle } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("map");
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  
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

  // Funcțiile pentru a schimba între tab-uri
  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
  };

  return (
    <TransportProvider>
      <Layout>
        <AboutDialog isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
        <section className="p-4 space-y-4">
          <ConnectivityAlert />
          <TransportControls />
          
          {/* Obținem starea transportului pentru a decide ce componente să afișăm */}
          <TransportComponentsWrapper activeTab={activeTab} onTabChange={handleTabChange} />
        </section>
      </Layout>
    </TransportProvider>
  );
}

// Componentă nouă pentru a gestiona afișarea condițională a componentelor de transport
function TransportComponentsWrapper({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const { transportStatus } = useTransport();
  const isTransportActive = transportStatus === "active" || transportStatus === "paused";
  
  // Dacă nu există un transport activ, nu afișăm nimic
  if (!isTransportActive) {
    return null;
  }
  
  // Dacă există un transport activ, afișăm toate componentele
  return (
    <>
      {/* Informații GPS afișate doar când există un transport activ */}
      <LocationTracking />
      
      {/* Înlocuim tabs cu propriul nostru sistem de navigare */}
      <div className="w-full">
        <div className="w-full grid grid-cols-2 rounded-xl bg-gray-100 p-1">
          <button 
            onClick={() => onTabChange("map")} 
            className={`rounded-lg py-2 px-4 font-medium transition-colors ${
              activeTab === "map" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Hartă
          </button>
          <button 
            onClick={() => onTabChange("stats")} 
            className={`rounded-lg py-2 px-4 font-medium transition-colors ${
              activeTab === "stats" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Statistici
          </button>
        </div>
        
        {/* Conținutul tab-ului activ */}
        <div className="space-y-4 pt-4 animate-in fade-in-50">
          {activeTab === "map" && (
            <div className="bg-white rounded-xl shadow-md p-4 transition-all">
              <TransportMap />
            </div>
          )}
          
          {activeTab === "stats" && (
            <>
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <TransportStats />
              </div>
              <div className="mt-6 space-y-4">
                <VoiceNotifications />
                <AudioTest />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
