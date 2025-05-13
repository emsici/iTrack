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

const vehicleSchema = z.object({
  registrationNumber: z.string()
    .min(2, "Numărul de înmatriculare trebuie să aibă cel puțin 2 caractere")
    .max(20, "Numărul de înmatriculare este prea lung")
    .regex(/^[A-Z0-9]+$/, "Numărul de înmatriculare trebuie să conțină doar litere mari și cifre"),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export default function VehicleInputPage() {
  const { registerVehicle, isAuthenticated, hasVehicle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-100">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <h1 className="text-2xl font-bold text-center text-primary-800 mb-6">
            Introduceți Numărul de Înmatriculare
          </h1>
          
          <div className="flex justify-center mb-6">
            <img 
              src="https://pixabay.com/get/g257fb8ff6f9da4643bad0e6c5bddd26cfda1209ab58bd2188f14a5692972141d22795bf1fefb36198aa12cf3e2bf254d1ae4f40cdd9f73babd004ce18c6a3791_1280.jpg" 
              alt="Truck registration" 
              className="rounded-lg shadow-sm w-full h-40 object-cover" 
            />
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
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Se verifică..." : "Verifică vehicul"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
