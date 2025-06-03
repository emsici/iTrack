import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, Login } from "@shared/schema";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Capacitor } from "@capacitor/core";
import { Truck, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login, isAuthenticated, hasVehicle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Detectăm dacă rulăm pe mobil sau pe desktop
  useEffect(() => {
    const isNativePlatform = Capacitor.isNativePlatform();
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    setIsMobile(isNativePlatform || isMobileDevice || window.innerWidth < 768);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (hasVehicle) {
        setLocation("/transport");
      } else {
        setLocation("/vehicle");
      }
    }
  }, [isAuthenticated, hasVehicle, setLocation]);

  const form = useForm<Login>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: Login) => {
    setIsLoading(true);
    console.log("Date de autentificare trimise:", data);

    // Verificare specială pentru credențialele de admin (acces la pagina de loguri)
    if (data.email === "admin@itrack.app" && data.password === "admin123") {
      console.log(
        "Credențiale admin detectate - redirecționare la pagina de loguri",
      );
      // Setăm un flag în sessionStorage pentru a indica autentificarea automată pe pagina de loguri
      sessionStorage.setItem("fromAdminLogin", "true");
      setIsLoading(false);
      // Redirecționare directă la pagina de loguri admin
      setLocation("/admin/logs");
      return;
    }

    try {
      const success = await login(data);
      console.log("Rezultat autentificare:", success);
    } catch (error) {
      console.error("Eroare la autentificare:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-4 ${isMobile ? "bg-gray-50" : "bg-gray-100"}`}
    >
      {/* Mobile Status Bar (for mobile app) */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 bg-blue-700 text-white p-2 flex justify-between items-center">
          <div className="flex items-center">
            <Truck className="h-4 w-4 text-white mr-1" />
            <span className="text-xs font-medium">iTrack</span>
          </div>
          <div className="text-xs flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-0.5"
            >
              <rect x="1" y="6" width="18" height="12" rx="2" />
              <line x1="23" y1="13" x2="23" y2="11" />
            </svg>
            100%
          </div>
        </div>
      )}

      <Card
        className={`w-full ${isMobile ? "max-w-sm shadow-sm mt-10" : "max-w-md shadow-md"}`}
      >
        <CardContent className={`${isMobile ? "pt-4" : "pt-6"}`}>
          <div className="flex justify-center mb-5">
            <div className="bg-primary-100 rounded-full p-3">
              <Truck className="h-10 w-10 text-primary" />
            </div>
          </div>

          <h1
            className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-center text-primary-800 mb-5`}
          >
            iTrack
          </h1>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="email@exemplu.com"
                        type="email"
                        autoComplete="email"
                        className={isMobile ? "h-10" : ""}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parolă</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="••••••••"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          className={isMobile ? "h-10 pr-10" : "pr-10"}
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className={`w-full ${isMobile ? "h-11 mt-2 text-base font-medium" : ""}`}
                disabled={isLoading}
              >
                {isLoading ? "Se autentifică..." : "Autentificare"}
              </Button>
            </form>
          </Form>

          {isMobile && (
            <div className="mt-5 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
              <p>© iTrack 2025</p>
              <p className="mt-1">Versiunea aplicației: 1.80799</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
