"use client";

import { useState, useEffect } from "react";
import { io } from "socket.io-client";

export default function ConnectionBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Inizializza la connessione verso l'URI del backend definito nelle variabili d'ambiente 
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URI!, {
      reconnectionAttempts: Infinity, // Tenta la riconnessione all'infinito
      timeout: 3000,                  // Riduce il tempo di attesa per rilevare il timeout
      transports: ["websocket"],      // Forza l'uso di websocket per un rilevamento più rapido
    });

    // Imposta lo stato offline se si verifica un errore di connessione iniziale
    socket.on("connect_error", () => {
      setIsOffline(true);
    });

    // Rileva la perdita di connessione dopo che era stata stabilita
    socket.on("disconnect", (reason) => {
      if (reason === "io client disconnect" || reason === "transport close") {
        setIsOffline(true);
      }
    });

    // Ripristina lo stato online non appena il server risponde
    socket.on("connect", () => {
      setIsOffline(false);
    });

    // Pulisce la connessione allo smontaggio del componente
    return () => {
      socket.disconnect();
    };
  }, []);

  // Non mostra nulla se il server è raggiungibile
  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-center py-2 font-black text-xs z-9999 animate-pulse shadow-xl uppercase tracking-widest">
        Il server non risponde - Verifica la connessione
    </div>
  );
}