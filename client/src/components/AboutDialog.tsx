import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);
  
  // Handler pentru click în afara dialogului pentru a-l închide
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialogDimensions = dialogRef.current?.getBoundingClientRect();
    if (
      dialogDimensions &&
      (e.clientX < dialogDimensions.left ||
        e.clientX > dialogDimensions.right ||
        e.clientY < dialogDimensions.top ||
        e.clientY > dialogDimensions.bottom)
    ) {
      onClose();
    }
  };
  
  return (
    <dialog 
      ref={dialogRef}
      className="fixed z-50 rounded-lg shadow-lg backdrop:bg-black backdrop:bg-opacity-50 p-0 max-w-md w-full border-0 outline-none"
      onClick={handleBackdropClick}
      onClose={onClose}
    >
      <div className="flex flex-col w-full">
        {/* Header */}
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center sticky top-0 z-10">
          <h3 className="text-lg font-bold">Despre aplicație</h3>
          <button 
            onClick={onClose}
            className="text-white hover:bg-blue-700 p-1 rounded-full transition-colors"
            aria-label="Închide"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto bg-white">
          <div className="prose max-w-none">
            <p className="mb-4 text-base">
              Aplicația <strong>iTrack</strong> permite șoferilor să gestioneze transporturile și să transmită coordonatele GPS în timp real către sistemul central.
            </p>
            
            <h3 className="text-lg font-medium text-blue-800 mb-2">Funcționalități</h3>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Autentificare securizată pentru șoferi</li>
              <li>Gestionarea statusului cursei (pornire, pauză, reluare, finalizare)</li>
              <li>Transmiterea automată a coordonatelor GPS din minut în minut</li>
              <li>Monitorizarea locației în timp real</li>
              <li>Informații despre UIT-uri (Unități de Transport) generate de ANAF</li>
              <li>Optimizarea consumului de baterie</li>
            </ul>
            
            <h3 className="text-lg font-medium text-blue-800 mb-2">Cum funcționează</h3>
            <p className="mb-3 text-base">
              La pornirea unei curse, aplicația va începe să transmită automat coordonatele GPS către server la fiecare minut. Transmisia se va întrerupe când șoferul activează pauza de odihnă și se va relua la reluarea cursei.
            </p>
            
            <p className="mb-4 text-base">
              Starea curentă a transmisiei GPS este indicată în partea de sus a ecranului principal. Un indicator verde înseamnă că transmisia este activă.
            </p>
            
            <h3 className="text-lg font-medium text-blue-800 mb-2">Date tehnice</h3>
            <p className="mb-4 text-base">
              Aplicația utilizează servicii de localizare în fundal și optimizează consumul bateriei prin ajustarea frecvenței de actualizare a GPS-ului în funcție de viteza de deplasare și de starea cursei.
            </p>
            
            <h3 className="text-lg font-medium text-blue-800 mb-2">Contact suport</h3>
            <p className="text-base">
              Dacă întâmpinați probleme, contactați echipa de suport la adresa de email <a href="mailto:support@transportgps.ro" className="text-blue-600 hover:underline">support@transportgps.ro</a> sau la numărul de telefon <a href="tel:+40212345678" className="text-blue-600 hover:underline">021 234 5678</a>.
            </p>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Închide
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}