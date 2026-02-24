"use client";

import { useState, useEffect } from "react";
import { QueueItem } from "@/types/queue";

interface TicketProps {
    item: QueueItem;
    isUser: boolean;
}

export default function TicketCoda({ item, isUser }: TicketProps) {
    // Estrae la stima temporale definita nel modello del backend
    const tempoTotaleSecondi = Math.floor(item.servingTimeEstimation / 1000);
    const [secondiRimanenti, setSecondiRimanenti] = useState(tempoTotaleSecondi);

    useEffect(() => {
        // Avvia il countdown solo per il ticket attualmente in servizio
        if (item.status !== 'serving' || secondiRimanenti <= 0) return;

        const timer = setInterval(() => {
            setSecondiRimanenti((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [item.status, secondiRimanenti]);

    const percentuale = (secondiRimanenti / tempoTotaleSecondi) * 100;

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
            {/* Sfondo di caricamento visibile solo per il ticket utente in servizio */}
            {isUser && item.status === 'serving' && (
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                    <div
                        className="h-full bg-indigo-50 transition-all duration-1000 ease-linear"
                        style={{ width: `${percentuale}%` }}
                    />
                </div>
            )}

            <span className="relative z-10 text-3xl font-black text-slate-800">
                #{item.ticket}
            </span>

            {/* Mostra la stima del tempo e il countdown SOLO se l'item appartiene all'utente */}
            {isUser && (
                <div className="relative z-10 flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">
                        {item.status === 'serving' ? 'Tuo Turno' : 'Attesa stimata'}
                    </span>
                    <span className="text-xl font-mono font-bold text-indigo-600">
                        {formattaTempo(secondiRimanenti)}
                    </span>
                </div>
            )}
        </div>
    );
}