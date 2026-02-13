"use client";

import { useState, useEffect } from "react";

interface TicketProps {
    numero: number;
    isUser: boolean;
    tempoInizialeMinuti: number;
}

export default function TicketCoda({ numero, isUser, tempoInizialeMinuti }: TicketProps) {
    // Converte il tempo in secondi per una gestione precisa del countdown
    const tempoTotaleSecondi = tempoInizialeMinuti * 60;
    const [secondiRimanenti, setSecondiRimanenti] = useState(tempoTotaleSecondi);

    useEffect(() => {
        // Avvia il timer solo se il ticket appartiene all'utente loggato
        if (!isUser || secondiRimanenti <= 0) return;

        const timer = setInterval(() => {
            setSecondiRimanenti((prev) => prev - 1);
        }, 1000);

        // Pulisce l'intervallo per evitare memory leak
        return () => clearInterval(timer);
    }, [isUser, secondiRimanenti]);

    // Calcola la percentuale di completamento per la barra di sfondo
    const percentuale = (secondiRimanenti / tempoTotaleSecondi) * 100;

    // Trasforma i secondi nel formato leggibile MM:SS
    const formattaTempo = (secondi: number) => {
        const m = Math.floor(secondi / 60);
        const s = secondi % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`
            relative flex flex-row items-center justify-between py-2 px-8
            w-full h-full rounded-full transition-all duration-500 overflow-hidden
            ${isUser ? 'bg-white border-2 border-indigo-500 shadow-lg' : 'bg-slate-50 opacity-60'}
        `}>
            {/* Barra di progresso */}
            {isUser && (
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                    <div
                        className="h-full bg-indigo-100 transition-all duration-1000 ease-linear"
                        style={{ width: `${percentuale}%` }}
                    />
                </div>
            )}

            {/* Numero del Ticket */}
            <span className="relative z-10 text-3xl font-black text-slate-800">
                #{numero}
            </span>

            {/* Timer: lo mostra solo per l'utente attivo */}
            {isUser && (
                <div className="relative z-10 flex items-center gap-2">
                    <div className="size-2 bg-indigo-500 rounded-full animate-pulse" />
                    <span className="text-2xl font-mono font-bold text-indigo-600">
                        {formattaTempo(secondiRimanenti)}
                    </span>
                </div>
            )}
        </div>
    );
}