"use client";

import { useState, useEffect } from "react";

interface TicketProps {
    numero: number;
    isUser: boolean;
    tempoInizialeMinuti: number; // Il "Tempo Totale" es. 10
}

export default function TicketCoda({ numero, isUser, tempoInizialeMinuti }: TicketProps) {
    // Converte tutto in secondi per precisione
    const tempoTotaleSecondi = tempoInizialeMinuti * 60;
    const [secondiRimanenti, setSecondiRimanenti] = useState(tempoTotaleSecondi);

    useEffect(() => {
        // Se non è il ticket dell'utente, l'applicazione non avvia il timer
        if (!isUser || secondiRimanenti <= 0) return;

        const timer = setInterval(() => {
            setSecondiRimanenti((prev) => prev - 1);
        }, 1000);

        // Pulisce il timer se il componente sparisce
        return () => clearInterval(timer);
    }, [isUser, secondiRimanenti]);

    // Calcolo dinamico della percentuale per la barra
    const percentuale = (secondiRimanenti / tempoTotaleSecondi) * 100;

    return (
        <div className={`
      relative flex flex-row items-center justify-center py-2 px-8
      w-full h-fit rounded-full transition-all duration-500 
      ${isUser ? 'bg-white border-2 border-indigo-500' : 'bg-slate-50 opacity-60'}
    `}>
            {/* Se è il turno dell'utente, mostra la barra del tempo */}
            {isUser && (
                <div className="absolute h-full w-full to-transparent rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-400 transition-all duration-1000 ease-linear"
                        style={{ width: `${percentuale}%` }}
                    />
                </div>
            )}
            <span className="mr-auto z-10 text-3xl font-black text-slate-800">#{numero}</span>
            {isUser && (
                <span className="ml-4 z-10 text-3xl font-black text-slate-800">00:00:00</span>
            )}
        </div>
    );
}