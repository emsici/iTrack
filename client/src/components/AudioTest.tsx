import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';

export default function AudioTest() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const speakMessage = (message: string) => {
    if (!window.speechSynthesis) {
      console.error('Speech synthesis not supported in this browser');
      return;
    }
    
    try {
      // Anulăm orice mesaj anterior
      window.speechSynthesis.cancel();
      
      console.log('Emitere mesaj audio:', message);
      
      // Creăm un nou mesaj
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'ro-RO';
      utterance.volume = 1.0;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      
      // Setăm starea de vorbire
      setIsSpeaking(true);
      
      // Adăugăm evenimentul pentru când se termină vorbirea
      utterance.onend = () => {
        console.log('Mesaj audio terminat');
        setIsSpeaking(false);
      };
      
      utterance.onerror = (event) => {
        console.error('Eroare la emiterea mesajului audio:', event);
        setIsSpeaking(false);
      };
      
      // Emitem mesajul
      window.speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('Eroare la emiterea mesajului audio:', error);
      setIsSpeaking(false);
    }
  };
  
  return (
    <Card className="my-4">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Volume2 className="mr-2 h-5 w-5 text-blue-500" />
          Test Audio
        </CardTitle>
        <CardDescription>
          Testați funcționalitatea audio pentru a verifica dacă notificările vocale funcționează corect.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button 
            variant="outline" 
            onClick={() => speakMessage('Test notificare vocală. Sistemul audio funcționează corect.')}
            disabled={isSpeaking}
          >
            Test mesaj standard
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => speakMessage('Transport început. Deplasare în curs.')}
            disabled={isSpeaking}
          >
            Mesaj pornire transport
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => speakMessage('Transport pus în pauză.')}
            disabled={isSpeaking}
          >
            Mesaj pauză transport
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => speakMessage('Transport finalizat cu succes.')}
            disabled={isSpeaking}
          >
            Mesaj finalizare transport
          </Button>
        </div>
        
        {isSpeaking && (
          <div className="mt-2 rounded-md bg-blue-50 p-2 text-sm text-blue-600">
            Redare mesaj audio în curs...
          </div>
        )}
        
        <div className="mt-4 text-xs text-gray-500">
          <p>Notă: Dacă nu auziți mesajele, verificați următoarele:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Volumul dispozitivului este pornit și suficient de mare</li>
            <li>Browser-ul are permisiune să redea audio</li>
            <li>Browser-ul suportă Web Speech API</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}