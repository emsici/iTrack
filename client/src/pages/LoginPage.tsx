import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { updateAuth } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.status === "success" || data.success) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userPassword", password);
        
        // Update auth state
        updateAuth();

        toast({
          title: "Succes",
          description: "Autentificare reușită!",
        });
        
        setLocation("/");
      } else {
        toast({
          title: "Eroare",
          description: data.message || "Autentificare eșuată",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Eroare",
        description: "Eroare de conectare",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">iTrack</h1>
          <p className="text-gray-600">Autentificare</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="exemplu@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Parolă
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Se conectează..." : "Autentificare"}
          </button>
        </form>
      </div>
    </div>
  );
}