import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface GpsCredentialsFormProps {
  onCredentialsSet: () => void;
}

export default function GpsCredentialsForm({ onCredentialsSet }: GpsCredentialsFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Eroare",
        description: "Email-ul și parola sunt obligatorii",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/gps/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (response.ok) {
        toast({
          title: "Succes",
          description: "Credențiale GPS setate cu succes",
        });
        onCredentialsSet();
      } else {
        const error = await response.json();
        toast({
          title: "Eroare",
          description: error.error || "Eroare la setarea credențialelor",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Eroare la setarea credențialelor GPS:", error);
      toast({
        title: "Eroare",
        description: "Eroare de conexiune",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Credențiale GPS</CardTitle>
        <CardDescription>
          Introduceți credențialele pentru serviciul GPS
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Introduceți email-ul"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Parolă</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Introduceți parola"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Se setează..." : "Setează credențiale"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}