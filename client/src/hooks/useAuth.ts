import { useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  vehicleRegistered?: boolean;
  vehicleInfo?: any;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authToken = localStorage.getItem("authToken");
      const vehicleInfo = localStorage.getItem("vehicleInfo");
      const userEmail = localStorage.getItem("userEmail");

      if (authToken && userEmail) {
        const userData: User = {
          id: userEmail,
          email: userEmail,
          vehicleRegistered: !!vehicleInfo,
          vehicleInfo: vehicleInfo ? JSON.parse(vehicleInfo) : null,
        };
        setUser(userData);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    checkAuth();

    // Listen for storage changes to update auth state
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    setUser,
  };
}