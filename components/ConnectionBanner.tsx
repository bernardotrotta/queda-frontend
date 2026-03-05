"use client";

import { useState, useEffect } from "react";
import { io } from "socket.io-client";

export default function ConnectionBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    /*
    console.log("Tentativo di connessione a:", process.env.NEXT_PUBLIC_BACKEND_URI);
    
    if (!process.env.NEXT_PUBLIC_BACKEND_URI) {
        console.error("Variabile d'ambiente BACKEND_URI mancante!");
        return;
    }
    */
   
    // Inizializza la connessione con il backend per monitorarne lo stato
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URI!, {
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    // Imposta lo stato su offline se la connessione fallisce
    socket.on("connect_error", () => setIsOffline(true));
    
    // Ripristina lo stato quando il server torna raggiungibile
    socket.on("connect", () => setIsOffline(false));

    return () => {
      socket.disconnect();
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-center py-2 font-black text-xs z-9999 animate-pulse shadow-xl">
        IL SERVER NON RISPONDE 
    </div>
  );
}