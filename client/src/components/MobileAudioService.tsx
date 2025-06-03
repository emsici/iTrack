import { useEffect, useRef, useState } from 'react';
import { useTransport } from '@/context/TransportContext';

// Serviciu audio simplu pentru notificări pe mobile
export function MobileAudioService() {
  const { transportStatus, isGpsActive } = useTransport();
  const [audioEnabled, setAudioEnabled] = useState(true);
  const prevStatusRef = useRef(transportStatus);
  const prevGpsRef = useRef(isGpsActive);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Inițializare AudioContext pentru mobile
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current && window.AudioContext) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log("AudioContext inițializat pentru notificări mobile");
      }
    };

    // Pentru mobile, așteptăm primul touch/click
    const enableAudio = () => {
      initAudio();
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };

    document.addEventListener('touchstart', enableAudio, { once: true });
    document.addEventListener('click', enableAudio, { once: true });

    return () => {
      document.removeEventListener('touchstart', enableAudio);
      document.removeEventListener('click', enableAudio);
    };
  }, []);

  // Funcție pentru emiterea unui sunet de notificare
  const playNotificationSound = (type: 'start' | 'pause' | 'finish' | 'gps_lost' | 'gps_restored') => {
    if (!audioEnabled || !audioContextRef.current) return;

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      // Configurare sunet în funcție de tip
      switch (type) {
        case 'start':
          // Sunet ascendent pentru începerea transportului
          oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(880, audioContextRef.current.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5);
          break;
          
        case 'pause':
          // Sunet neutru pentru pauză
          oscillator.frequency.setValueAtTime(660, audioContextRef.current.currentTime);
          gainNode.gain.setValueAtTime(0.2, audioContextRef.current.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);
          break;
          
        case 'finish':
          // Sunet de confirmare pentru finalizare
          oscillator.frequency.setValueAtTime(523, audioContextRef.current.currentTime);
          oscillator.frequency.setValueAtTime(659, audioContextRef.current.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(784, audioContextRef.current.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.4);
          break;
          
        case 'gps_lost':
          // Sunet de alarmă pentru GPS pierdut
          oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
          oscillator.frequency.setValueAtTime(400, audioContextRef.current.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.4, audioContextRef.current.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);
          break;
          
        case 'gps_restored':
          // Sunet de confirmare pentru GPS restabilit
          oscillator.frequency.setValueAtTime(400, audioContextRef.current.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(800, audioContextRef.current.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.2, audioContextRef.current.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);
          break;
      }

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.5);
      
      console.log(`Sunet notificare emis: ${type}`);
    } catch (error) {
      console.error("Eroare la emiterea sunetului de notificare:", error);
    }
  };

  // Monitorizare schimbări de stare transport
  useEffect(() => {
    if (transportStatus !== prevStatusRef.current) {
      console.log(`Schimbare stare transport: ${prevStatusRef.current} -> ${transportStatus}`);
      
      switch (transportStatus) {
        case 'active':
          playNotificationSound('start');
          break;
        case 'paused':
          playNotificationSound('pause');
          break;
        case 'finished':
          playNotificationSound('finish');
          break;
      }
      
      prevStatusRef.current = transportStatus;
    }
  }, [transportStatus]);

  // Monitorizare schimbări GPS
  useEffect(() => {
    if (isGpsActive !== prevGpsRef.current && transportStatus === 'active') {
      if (!isGpsActive) {
        playNotificationSound('gps_lost');
        console.log("GPS pierdut - sunet de alarmă emis");
      } else {
        playNotificationSound('gps_restored');
        console.log("GPS restabilit - sunet de confirmare emis");
      }
      
      prevGpsRef.current = isGpsActive;
    }
  }, [isGpsActive, transportStatus]);

  return null; // Componenta nu renderează nimic
}