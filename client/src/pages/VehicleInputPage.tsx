import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function VehicleInputPage() {
  const [, setLocation] = useLocation();
  const [vehicleNumber, setVehicleNumber] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const vehicleMutation = useMutation({
    mutationFn: async (registrationNumber: string) => {
      const authToken = localStorage.getItem("authToken");
      return await apiRequest("/api/vehicle", {
        method: "POST",
        body: JSON.stringify({ registrationNumber, authToken }),
      });
    },
    onSuccess: (data) => {
      if (data.success && data.vehicleInfo) {
        localStorage.setItem("vehicleInfo", JSON.stringify(data.vehicleInfo));
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({
          title: "Succes",
          description: "Vehicul înregistrat cu succes!",
        });
        setLocation("/");
      } else {
        toast({
          title: "Eroare",
          description: data.message || "Înregistrare eșuată",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Eroare",
        description: "Eroare de înregistrare",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    vehicleMutation.mutate(vehicleNumber.toUpperCase());
  };

  const logout = () => {
    localStorage.clear();
    queryClient.clear();
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <svg className="w-16 h-16 mx-auto mb-4 text-blue-600" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="4" width="11" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1"/>
            <path d="M13 6h3l3 3v4a1 1 0 01-1 1h-1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M13 9h6" stroke="currentColor" strokeWidth="1"/>
            <circle cx="6" cy="17" r="2" stroke="currentColor" strokeWidth="1.5" fill="white"/>
            <circle cx="16" cy="17" r="2" stroke="currentColor" strokeWidth="1.5" fill="white"/>
            <circle cx="6" cy="17" r="0.8" fill="currentColor"/>
            <circle cx="16" cy="17" r="0.8" fill="currentColor"/>
          </svg>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Înregistrare Vehicul</h1>
          <p className="text-gray-600">Introduceți numărul de înmatriculare</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="text-sm text-gray-600 mb-2">ROMÂNIA</div>
            <div className="text-2xl font-bold text-gray-900 mb-4">
              {vehicleNumber || "B123XYZ"}
            </div>
          </div>

          <div>
            <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Număr de înmatriculare
            </label>
            <input
              type="text"
              id="vehicleNumber"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono"
              placeholder="EX: B123XYZ"
              required
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              Introduceți numărul de înmatriculare exact cum apare pe certificatul de înmatriculare, fără spații sau caractere speciale.
            </p>
          </div>

          <button
            type="submit"
            disabled={vehicleMutation.isPending}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {vehicleMutation.isPending ? "Se înregistrează..." : "Verifică vehicul"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={logout}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Deconectare
          </button>
        </div>
      </div>
    </div>
  );
}