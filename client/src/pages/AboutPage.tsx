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
              Aplicația <strong>iTrack</strong> este o soluție profesională care permite șoferilor să gestioneze transporturile, să transmită coordonatele GPS în timp real către sistemul central, și să monitorizeze performanța deplasărilor cu instrumente avansate de analiză.
            </p>

            <h3 className="text-base font-medium text-secondary-800 mb-2">Funcționalități principale</h3>
            <ul className="list-disc pl-5 mb-3 space-y-1">
              <li>Autentificare securizată cu token JWT pentru șoferi</li>
              <li>Gestionare completă a statusului cursei (pornire, pauză, reluare, finalizare)</li>
              <li>Transmitere automată a coordonatelor GPS la interval de 1 minut</li>
              <li>Monitorizare locație în timp real cu hartă interactivă</li>
              <li>Gestionare UIT-uri (Unități de Transport) generate de ANAF</li>
              <li>Reîncărcare automată a listei de transporturi după finalizare</li>
              <li>Procesare în fundal chiar și când telefonul e blocat</li>
            </ul>

            <h3 className="text-base font-medium text-secondary-800 mb-2">Funcționalități avansate</h3>
            <ul className="list-disc pl-5 mb-3 space-y-1">
              <li>Stocare offline a coordonatelor GPS când nu există conexiune</li>
              <li>Notificări vocale pentru evenimente importante (pornire, pauză, finalizare)</li>
              <li>Detectare automată a direcției de deplasare din senzorii dispozitivului</li>
              <li>Colectare date senzoriale complexe (altitudine, viteză, baterie, direcție)</li>
              <li>Algoritm adaptiv pentru calculul distanței parcurse</li>
              <li>Statistici detaliate în timp real (viteză medie, maximă, consum baterie)</li>
              <li>Format JSON optimizat pentru comunicarea cu serverul</li>
              <li>Header-e personalizate pentru autentificare și identificare transport</li>
            </ul>
            
            <h3 className="text-base font-medium text-secondary-800 mb-2">Cum funcționează</h3>
            <p className="mb-2">
              La pornirea unei curse, aplicația începe să transmită automat coordonatele GPS către server la interval de 1 minut. Transmisia se întrerupe când șoferul activează pauza de odihnă sau finalizează transportul, și se reia la reluarea cursei. Sistemul utilizează headere HTTP personalizate (X-Vehicle-Number și X-UIT) pentru identificarea transportului.
            </p>
            
            <p className="mb-3">
              Aplicația funcționează în fundal chiar și când dispozitivul este blocat, asigurând continuitatea monitorizării. Conexiunea la internet este verificată constant, iar datele sunt stocate local atunci când rețeaua nu este disponibilă, pentru sincronizare ulterioară.
            </p>
            
            <h3 className="text-base font-medium text-secondary-800 mb-2">Tehnologii integrate</h3>
            <p className="mb-3">
              iTrack folosește tehnologii moderne precum Capacitor pentru funcționalități native pe Android și iOS, React pentru interfața utilizator, Leaflet pentru hărți interactive, și algoritmi specializați pentru managementul bateriei. Aplicația detectează automat direcția de deplasare folosind senzorul de orientare al dispozitivului și utilizează formula Haversine pentru calcularea precisă a distanțelor între coordonate GPS.
            </p>
            
            <h3 className="text-base font-medium text-secondary-800 mt-3 mb-2">Contact suport</h3>
            <p>
              Dacă întâmpinați probleme, contactați echipa de suport la adresa de email <a href="mailto:support@itrack.ro" className="text-primary-600 hover:underline">support@transportgps.ro</a> sau la numărul de telefon <a href="tel:+40212345678" className="text-primary-600 hover:underline">021 234 5678</a>.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
