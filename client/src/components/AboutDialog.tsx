import React from "react";
import { Info, X } from "lucide-react";

export function AboutDialog() {
  // Funcție pentru deschiderea dialogului
  const openAboutDialog = () => {
    const dialog = document.getElementById('aboutDialog') as HTMLDialogElement;
    if (dialog) {
      dialog.showModal();
    }
  };
  
  // Funcție pentru închiderea dialogului
  const closeAboutDialog = () => {
    const dialog = document.getElementById('aboutDialog') as HTMLDialogElement;
    if (dialog) {
      dialog.close();
    }
  };
  
  return (
    <div className="flex items-center h-full">
      <button 
        onClick={openAboutDialog}
        className="flex items-center gap-1 text-white hover:text-blue-200"
        aria-label="Despre aplicație"
      >
        <Info className="h-4 w-4" />
      </button>
      
      <div className="bg-blue-600 p-4 text-white flex justify-between items-center w-full">
        <h3 className="text-lg font-bold">Despre aplicație</h3>
        <button 
          onClick={closeAboutDialog}
          className="text-white opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Închide"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="p-6 overflow-y-auto max-h-[70vh]">
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
            Dacă întâmpinați probleme, contactați echipa de suport la adresa de email <a href="mailto:support@transportgps.ro" className="text-primary-600 hover:underline">support@transportgps.ro</a> sau la numărul de telefon <a href="tel:+40212345678" className="text-primary-600 hover:underline">021 234 5678</a>.
          </p>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button 
            onClick={closeAboutDialog}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Închide
          </button>
        </div>
      </div>
    </div>
  );
}