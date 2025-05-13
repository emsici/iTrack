import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/MainLayout";
import MobileLayout from "@/components/MobileLayout";
import { Capacitor } from "@capacitor/core";

export default function AboutPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  
  // Detectăm dacă rulăm pe mobil sau pe desktop
  useEffect(() => {
    const isNativePlatform = Capacitor.isNativePlatform();
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(isNativePlatform || isMobileDevice || window.innerWidth < 768);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  // Only render page if authenticated
  if (!isAuthenticated) {
    return null;
  }
  
  // Folosim layout-ul potrivit în funcție de platformă
  const Layout = isMobile ? MobileLayout : MainLayout;

  return (
    <Layout>
      <section>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-bold text-secondary-800 mb-4">Despre aplicație</h2>
          
          <div className="prose max-w-none text-sm">
            <p className="mb-3">
              Aplicația <strong>iTrack</strong> permite șoferilor să gestioneze transporturile și să transmită coordonatele GPS în timp real către sistemul central.
            </p>
            
            <h3 className="text-base font-medium text-secondary-800 mb-2">Funcționalități</h3>
            <ul className="list-disc pl-5 mb-3 space-y-1">
              <li>Autentificare securizată pentru șoferi</li>
              <li>Gestionarea statusului cursei (pornire, pauză, reluare, finalizare)</li>
              <li>Transmiterea automată a coordonatelor GPS din minut în minut</li>
              <li>Monitorizarea locației în timp real</li>
              <li>Informații despre UIT-uri (Unități de Transport) generate de ANAF</li>
              <li>Optimizarea consumului de baterie</li>
            </ul>
            
            <h3 className="text-base font-medium text-secondary-800 mb-2">Cum funcționează</h3>
            <p className="mb-2">
              La pornirea unei curse, aplicația va începe să transmită automat coordonatele GPS către server la fiecare minut. Transmisia se va întrerupe când șoferul activează pauza de odihnă și se va relua la reluarea cursei.
            </p>
            
            <p className="mb-3">
              Starea curentă a transmisiei GPS este indicată în partea de sus a ecranului principal. Un indicator verde înseamnă că transmisia este activă.
            </p>
            
            <h3 className="text-base font-medium text-secondary-800 mb-2">Date tehnice</h3>
            <p className="mb-3">
              Aplicația utilizează servicii de localizare în fundal și optimizează consumul bateriei prin ajustarea frecvenței de actualizare a GPS-ului în funcție de viteza de deplasare și de starea cursei.
            </p>
            
            <h3 className="text-base font-medium text-secondary-800 mt-3 mb-2">Contact suport</h3>
            <p>
              Dacă întâmpinați probleme, contactați echipa de suport la adresa de email <a href="mailto:support@itrack.ro" className="text-primary-600 hover:underline">support@itrack.ro</a> sau la numărul de telefon <a href="tel:+40212345678" className="text-primary-600 hover:underline">021 234 5678</a>.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
