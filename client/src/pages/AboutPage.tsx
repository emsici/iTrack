import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/MainLayout";

export default function AboutPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

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

  return (
    <MainLayout>
      <section>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-secondary-800 mb-4">Despre aplicație</h2>
          
          <div className="mb-6">
            <img 
              src="https://pixabay.com/get/gd1fcb71212a1ee0d9c91097f00a66c8bd807735b0965a5df048dfc573266dfe286d83e0a53ed10e48dd14ba90a56bc2f8c553609d46a9616d2a6b3f48929e145_1280.jpg" 
              alt="Truck driver using app" 
              className="w-full h-48 object-cover rounded-lg mb-4" 
            />
          </div>
          
          <div className="prose max-w-none">
            <p className="mb-4">
              Aplicația <strong>Transport GPS Tracking</strong> permite șoferilor să gestioneze transporturile și să transmită coordonatele GPS în timp real către sistemul central.
            </p>
            
            <h3 className="text-lg font-medium text-secondary-800 mb-2">Funcționalități</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Autentificare securizată pentru șoferi</li>
              <li>Gestionarea statusului cursei (pornire, pauză, reluare, finalizare)</li>
              <li>Transmiterea automată a coordonatelor GPS din minut în minut</li>
              <li>Monitorizarea locației în timp real</li>
              <li>Informații despre UIT-uri (Unități de Transport) generate de ANAF</li>
              <li>Optimizarea consumului de baterie</li>
            </ul>
            
            <h3 className="text-lg font-medium text-secondary-800 mb-2">Cum funcționează</h3>
            <p className="mb-2">
              La pornirea unei curse, aplicația va începe să transmită automat coordonatele GPS către server la fiecare minut. Transmisia se va întrerupe când șoferul activează pauza de odihnă și se va relua la reluarea cursei.
            </p>
            
            <p className="mb-4">
              Starea curentă a transmisiei GPS este indicată în partea de sus a ecranului principal. Un indicator verde înseamnă că transmisia este activă.
            </p>
            
            <h3 className="text-lg font-medium text-secondary-800 mb-2">Date tehnice</h3>
            <p>
              Aplicația utilizează servicii de localizare în fundal și optimizează consumul bateriei prin ajustarea frecvenței de actualizare a GPS-ului în funcție de viteza de deplasare și de starea cursei.
            </p>
            
            <h3 className="text-lg font-medium text-secondary-800 mt-4 mb-2">Contact suport</h3>
            <p>
              Dacă întâmpinați probleme, contactați echipa de suport la adresa de email <a href="mailto:support@transportgps.ro" className="text-primary-600 hover:underline">support@transportgps.ro</a> sau la numărul de telefon <a href="tel:+40212345678" className="text-primary-600 hover:underline">021 234 5678</a>.
            </p>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
