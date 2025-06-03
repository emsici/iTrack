import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Transport {
  uit: string;
  start_locatie: string;
  stop_locatie: string;
  dataTransport: string;
  ikRoTrans: number;
}

interface VehicleInfo {
  nr: string;
  uit: string;
  start_locatie: string;
  stop_locatie: string;
  allTransports: Transport[];
}

export default function TransportPage() {
  const [, setLocation] = useLocation();
  const [activeTransports, setActiveTransports] = useState<Set<string>>(new Set());
  const [gpsInterval, setGpsInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const vehicleInfo: VehicleInfo | null = JSON.parse(localStorage.getItem("vehicleInfo") || "null");

  useEffect(() => {
    if (!vehicleInfo) {
      setLocation("/");
    }
  }, [vehicleInfo, setLocation]);

  const startTransport = async (uit: string) => {
    try {
      setActiveTransports(prev => new Set([...prev, uit]));

      // Set GPS credentials
      const email = localStorage.getItem("userEmail") || "";
      const password = localStorage.getItem("userPassword") || "";
      
      await fetch("/api/gps/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // Start GPS transmission
      if (gpsInterval) {
        clearInterval(gpsInterval);
      }

      const interval = setInterval(async () => {
        try {
          const gpsData = {
            vehicleNumber: vehicleInfo?.nr,
            uit: uit,
            latitude: 44.4268 + (Math.random() - 0.5) * 0.01,
            longitude: 26.1025 + (Math.random() - 0.5) * 0.01,
            timestamp: new Date().toISOString(),
            status: 2,
          };

          const response = await fetch("/api/gps/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(gpsData),
          });

          const result = await response.json();
          console.log("GPS data sent:", result);
        } catch (error) {
          console.error("GPS transmission error:", error);
        }
      }, 60000);

      setGpsInterval(interval);

      toast({
        title: "Transport pornit",
        description: `Transport activ pentru UIT: ${uit}`,
      });
    } catch (error) {
      setActiveTransports(prev => {
        const newSet = new Set(prev);
        newSet.delete(uit);
        return newSet;
      });
      toast({
        title: "Eroare",
        description: "Nu s-a putut porni transportul",
        variant: "destructive",
      });
    }
  };

  const stopTransport = (uit: string) => {
    setActiveTransports(prev => {
      const newSet = new Set(prev);
      newSet.delete(uit);
      return newSet;
    });

    if (gpsInterval) {
      clearInterval(gpsInterval);
      setGpsInterval(null);
    }

    toast({
      title: "Transport oprit",
      description: `Transport oprit pentru UIT: ${uit}`,
    });
  };

  const logout = () => {
    if (gpsInterval) {
      clearInterval(gpsInterval);
    }
    localStorage.clear();
    queryClient.clear();
    setLocation("/");
  };

  if (!vehicleInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <div>
              <h1 className="text-lg font-semibold">iTrack</h1>
              <div className="text-sm opacity-90">{vehicleInfo.nr}</div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="bg-white bg-opacity-20 text-white px-3 py-1 rounded text-sm hover:bg-opacity-30 transition-colors"
          >
            Ieșire
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-100 p-3 border-b">
        <div className="max-w-md mx-auto">
          <span className="text-sm text-gray-600">dumneavoastră</span>
        </div>
      </div>

      {/* Transport List */}
      <div className="max-w-md mx-auto bg-white">
        {vehicleInfo.allTransports?.map((transport) => {
          const isActive = activeTransports.has(transport.uit);
          
          return (
            <div key={transport.uit} className="border-l-4 border-blue-600 bg-white p-5 mb-4 shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <span className="text-lg font-semibold text-gray-900">
                    {isActive ? "Activ" : "Inactiv"}
                  </span>
                </div>
                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* UIT */}
              <div className="text-sm text-gray-600 mb-4">
                UIT: {transport.uit}
              </div>

              {/* Route */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">{transport.start_locatie}</span>
                </div>
                <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none">
                  <path d="M7 17l9.2-9.2M17 17H7V7" stroke="currentColor" strokeWidth="1"/>
                </svg>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-sm">{transport.stop_locatie}</span>
                </div>
              </div>

              {/* Status Info */}
              <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                <span className="text-red-500">GPS: {isActive ? "Activ" : "Inactiv"}</span>
                <span>Baterie: 100%</span>
              </div>

              {/* Action Button */}
              <button
                onClick={() => isActive ? stopTransport(transport.uit) : startTransport(transport.uit)}
                className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                  isActive 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  {isActive ? (
                    <>
                      <rect x="6" y="4" width="4" height="16"/>
                      <rect x="14" y="4" width="4" height="16"/>
                    </>
                  ) : (
                    <polygon points="5,3 19,12 5,21"/>
                  )}
                </svg>
                {isActive ? "Oprește Transport" : "Pornește Transport"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 text-center text-xs text-gray-500">
        © iTrack 2025 | Versiunea aplicației: 1.80799
      </div>
    </div>
  );
}