import { ReactNode, useEffect, useState } from "react";
import MobileHeader from "./MobileHeader";
import { Capacitor } from "@capacitor/core";

interface MobileLayoutProps {
  children: ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  
  // Detectam daca rulam pe un dispozitiv mobil sau in browser
  useEffect(() => {
    // Verificam daca rulam pe platforma nativa cu Capacitor
    const checkPlatform = () => {
      const isNative = Capacitor.isNativePlatform();
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isNative || isMobileDevice || window.innerWidth < 768);
    };
    
    checkPlatform();
    
    // Adaugam un event listener pentru redimensionarea ferestrei
    window.addEventListener('resize', checkPlatform);
    
    return () => {
      window.removeEventListener('resize', checkPlatform);
    };
  }, []);
  
  return (
    <div className={`flex flex-col min-h-screen ${isMobile ? 'bg-gray-50' : 'bg-gray-100'}`}>
      {/* Header specific pentru mobil */}
      <MobileHeader />
      
      {/* Main content */}
      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        {children}
      </main>
      
      {/* Footer pentru mobil */}
      <footer className="bg-secondary-800 text-white p-2 text-center text-xs">
        <p>Transport GPS Tracking v1.0</p>
      </footer>
    </div>
  );
}