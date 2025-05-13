import { useTransport } from "@/context/TransportContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Play, Pause, Check } from "lucide-react";

export default function TransportControls() {
  const { transportStatus, startTransport, pauseTransport, resumeTransport, finishTransport, isGpsActive, battery } = useTransport();
  const { vehicleInfo } = useAuth();

  // Helper function to determine status indicator class
  const getStatusIndicatorClass = () => {
    if (transportStatus === "active" && isGpsActive) {
      return "bg-success shadow-[0_0_0_3px_rgba(16,185,129,0.2)]";
    } else if (transportStatus === "paused") {
      return "bg-warning shadow-[0_0_0_3px_rgba(245,158,11,0.2)]";
    } else if (transportStatus === "finished") {
      return "bg-secondary-500 shadow-[0_0_0_3px_rgba(107,114,128,0.2)]";
    } else {
      return "bg-destructive shadow-[0_0_0_3px_rgba(239,68,68,0.2)]";
    }
  };

  // Helper function for status text
  const getStatusText = () => {
    if (transportStatus === "active" && isGpsActive) {
      return "GPS Activ";
    } else if (transportStatus === "paused") {
      return "GPS Pauză";
    } else if (transportStatus === "finished") {
      return "Transport Finalizat";
    } else {
      return "GPS Inactiv";
    }
  };

  // Helper function for status text color
  const getStatusTextClass = () => {
    if (transportStatus === "active" && isGpsActive) {
      return "text-success";
    } else if (transportStatus === "paused") {
      return "text-warning";
    } else if (transportStatus === "finished") {
      return "text-secondary-500";
    } else {
      return "text-destructive";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-secondary-800">{vehicleInfo?.nr}</h2>
          <p className="text-sm text-secondary-500">UIT: <span>{vehicleInfo?.uit}</span></p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center mb-1">
            <span 
              className={`w-3 h-3 rounded-full mr-2 ${getStatusIndicatorClass()}`} 
              aria-hidden="true"
            />
            <span className={`text-sm font-medium ${getStatusTextClass()}`}>
              {getStatusText()}
            </span>
          </div>
          <span className="text-xs text-secondary-500">Baterie: {Math.round(battery)}%</span>
        </div>
      </div>
      
      <div className="border-t border-b border-secondary-200 py-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between">
          <div className="mb-3 sm:mb-0">
            <p className="text-sm text-secondary-500">Plecare</p>
            <p className="font-medium">{vehicleInfo?.start_locatie}</p>
          </div>
          <div className="hidden sm:flex items-center">
            <svg className="h-5 w-5 text-secondary-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm text-secondary-500">Destinație</p>
            <p className="font-medium">{vehicleInfo?.stop_locatie}</p>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-secondary-700 mb-2">Status Transport</h3>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="custom"
            className={`flex-1 bg-success text-white hover:bg-opacity-90 disabled:opacity-50 ${
              transportStatus !== "inactive" ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={startTransport}
            disabled={transportStatus !== "inactive"}
          >
            <Play className="h-4 w-4 mr-1" /> Start cursă
          </Button>
          
          <Button 
            variant="custom"
            className={`flex-1 bg-warning text-white hover:bg-opacity-90 disabled:opacity-50 ${
              transportStatus !== "active" ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={pauseTransport}
            disabled={transportStatus !== "active"}
          >
            <Pause className="h-4 w-4 mr-1" /> Pauză de odihnă
          </Button>
          
          <Button 
            variant="custom"
            className={`flex-1 bg-info text-white hover:bg-opacity-90 disabled:opacity-50 ${
              transportStatus !== "paused" ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={resumeTransport}
            disabled={transportStatus !== "paused"}
          >
            <Play className="h-4 w-4 mr-1" /> Reluare cursă
          </Button>
          
          <Button 
            variant="custom"
            className={`flex-1 bg-secondary-600 text-white hover:bg-opacity-90 disabled:opacity-50 ${
              (transportStatus !== "active" && transportStatus !== "paused") ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={finishTransport}
            disabled={transportStatus !== "active" && transportStatus !== "paused"}
          >
            <Check className="h-4 w-4 mr-1" /> Finalizare transport
          </Button>
        </div>
      </div>
    </div>
  );
}
