"use client";

import { useState, useEffect } from "react";
import { QueueItem } from "@/types/queue";

interface TicketProps {
    item: QueueItem;
    isUser: boolean;
    tempoAttesaTotaleMs: number; // Valore in millisecondi ricevuto dal backend tramite il genitore
}

export default function TicketCoda({ item, isUser, tempoAttesaTotaleMs }: TicketProps) {
    // Gestisce il countdown locale per l'arrivo del proprio turno
    const [secondiRimanenti, setSecondiRimanenti] = useState(Math.floor(tempoAttesaTotaleMs / 1000));

    // Sincronizza il countdown locale ogni volta che il server invia una nuova stima
    useEffect(() => {
        // Aggiorna lo stato interno con il nuovo valore di attesa stimata
        setSecondiRimanenti(Math.floor(tempoAttesaTotaleMs / 1000));
    }, [tempoAttesaTotaleMs]);

    useEffect(() => {
        // Interrompe il timer se l'utente è già servito o se il tempo è esaurito
        if (item.status === 'served' || item.status === 'quit' || secondiRimanenti <= 0) return;

        // Decrementa il contatore ogni secondo per fluidità visiva
        const timer = setInterval(() => {
            setSecondiRimanenti((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [item.status, secondiRimanenti]);

    // Formatta la durata rimanente in minuti e secondi
    const formattaTempo = (secondi: number) => {
        const m = Math.floor(Math.max(0, secondi) / 60);
        const s = Math.max(0, secondi) % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`
            relative flex flex-row items-center justify-between py-2 px-8
            w-full h-20 rounded-full transition-all duration-500 overflow-hidden
            ${isUser ? 'bg-white border-2 border-indigo-500 shadow-lg' : 'bg-slate-50 border border-slate-200'}
        `}>
            {/* Mostra il numero del ticket assegnato dal contatore atomico del database */}
            <span className="relative z-10 text-3xl font-black text-slate-800 tracking-tighter">
                #{item.ticket}
            </span>

            {/* Visualizza i dettagli temporali solo se il ticket appartiene all'utente loggato */}
            {isUser && (
                <div className="relative z-10 flex flex-col items-end animate-in fade-in duration-300">
                    <span className="text-[10px] font-bold text-slate-400 uppercase leading-none tracking-widest">
                        {item.status === 'serving' ? 'Tuo Turno' : 'Arrivo Stimato'}
                    </span>
                    <span className="text-xl font-mono font-bold text-indigo-600">
                        {/* Gestisce lo stato 'serving' come priorità visiva */}
                        {item.status === 'serving' ? "ORA" : formattaTempo(secondiRimanenti)}
                    </span>
                </div>
            )}

            {/* Indicatore visivo opzionale per i ticket in attesa degli altri utenti */}
            {!isUser && item.status === 'serving' && (
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">
                    In Servizio
                </span>
            )}
        </div>
    );
}