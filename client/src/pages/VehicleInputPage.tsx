import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Capacitor } from "@capacitor/core";
import { Truck, ArrowLeft } from "lucide-react";

const vehicleSchema = z.object({
  registrationNumber: z.string()
    .min(2, "Numărul de înmatriculare trebuie să aibă cel puțin 2 caractere")
    .max(20, "Numărul de înmatriculare este prea lung")
    .regex(/^[A-Z0-9]+$/, "Numărul de înmatriculare trebuie să conțină doar litere mari și cifre"),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export default function VehicleInputPage() {
  const { registerVehicle, isAuthenticated, hasVehicle, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  // Detectăm dacă rulăm pe mobil sau pe desktop
  useEffect(() => {
    const isNativePlatform = Capacitor.isNativePlatform();
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(isNativePlatform || isMobileDevice || window.innerWidth < 768);
  }, []);

  // Redirect if not authenticated or already has a vehicle
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/');
    } else if (hasVehicle) {
      setLocation('/transport');
    }
  }, [isAuthenticated, hasVehicle, setLocation]);

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      registrationNumber: "",
    },
  });

  const onSubmit = async (data: VehicleFormValues) => {
    setIsLoading(true);
    try {
      await registerVehicle(data.registrationNumber);
    } finally {
      setIsLoading(false);
    }
  };

  // Only render page if authenticated and doesn't have a vehicle yet
  if (!isAuthenticated || hasVehicle) {
    return null;
  }

  const handleBack = () => {
    if (confirm("Sigur doriți să vă deconectați?")) {
      logout();
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-4 ${isMobile ? 'bg-gray-50' : 'bg-gray-100'}`}>
      {/* Mobile Status Bar (for mobile app) */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 bg-secondary-800 text-white p-2 flex justify-between items-center">
          <div className="flex items-center">
            <button onClick={handleBack} className="mr-2 p-1">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <Truck className="h-4 w-4 text-primary mr-1" />
            <span className="text-xs font-medium">Transport GPS</span>
          </div>
          <div className="text-xs">v1.0</div>
        </div>
      )}
      
      <Card className={`w-full ${isMobile ? 'max-w-sm shadow-sm mt-10' : 'max-w-md shadow-md'}`}>
        <CardContent className={`${isMobile ? 'pt-4' : 'pt-6'}`}>
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-center text-primary-800 mb-4`}>
            Introduceți Numărul de Înmatriculare
          </h1>
          
          <div className="flex justify-center mb-5">
            <div className={`rounded-lg w-full ${isMobile ? 'h-32' : 'h-40'} overflow-hidden bg-gray-200 flex items-center justify-center`}>
              <div className="bg-secondary-200 rounded-lg px-4 py-2 text-secondary-800 font-bold shadow-inner text-center">
                <span className="block text-xs text-secondary-500 mb-1">ROMÂNIA</span>
                <div className="border-2 border-primary-600 px-3 py-1 rounded">
                  <span className="text-xl">{form.watch("registrationNumber") || "B123XYZ"}</span>
                </div>
              </div>
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Număr de înmatriculare</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ex: B123XYZ" 
                        className={isMobile ? 'h-10 text-base uppercase' : 'uppercase'}
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className={`w-full ${isMobile ? 'h-11 mt-2 text-base font-medium' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? "Se verifică..." : "Verifică vehicul"}
              </Button>
            </form>
          </Form>
          
          {isMobile && (
            <p className="mt-4 text-xs text-center text-secondary-500">
              Introduceți numărul de înmatriculare exact cum apare pe certificatul de înmatriculare, 
              fără spații sau caractere speciale.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
