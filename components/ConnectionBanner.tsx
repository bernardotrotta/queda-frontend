"use client";

import { useState, useEffect } from "react";
import { io } from "socket.io-client";

export default function ConnectionBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Initializes the connection towards the URI of the backend, defined in the environment variables
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URI!, {
      reconnectionAttempts: Infinity, // Always tries to reconnect
      timeout: 3000,                  // Reduces the waiting time to detect timeout
      transports: ["websocket"],      // Forces the use of websocket for a quicker detection
    });

    // Set the offline status if there is a first connection error
    socket.on("connect_error", () => {
      setIsOffline(true);
    });

    // Detects the loss of connection after it has been established
    socket.on("disconnect", (reason) => {
      if (reason === "io client disconnect" || reason === "transport close") {
        setIsOffline(true);
      }
    });

    // Recovers the online status right when the server responds
    socket.on("connect", () => {
      setIsOffline(false);
    });

    // Cleans the connection when the component has been dismounted
    return () => {
      socket.disconnect();
    };
  }, []);

  // Doesn't show anything is the server is online
  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-center py-2 font-black text-xs z-9999 animate-pulse shadow-xl uppercase tracking-widest">
        Il server non risponde - Verifica la connessione
    </div>
  );
}