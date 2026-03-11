"use client";

import { useState, useEffect } from "react";
import { QueueItem } from "@/types/queue";

interface TicketProps {
    item: QueueItem;
    isUser: boolean;
    tempoAttesaTotaleMs: number; // Value (in milliseconds) received from the backend 
}

export default function TicketQueue({ item, isUser, tempoAttesaTotaleMs }: TicketProps) {
    // Manages the local countdown for the arrival of our own turn
    const [secondiRimanenti, setSecondiRimanenti] = useState(Math.floor(tempoAttesaTotaleMs / 1000));

    // Synchronizes the local countdown each time the server sends a new estimate
    useEffect(() => {
        // Updates the internal state with the new value of estimated wait
        setSecondiRimanenti(Math.floor(tempoAttesaTotaleMs / 1000));
    }, [tempoAttesaTotaleMs]);

    useEffect(() => {
        // Interrupts the timer if the user has already been served or if the time has run out
        if (item.status === 'served' || item.status === 'quit' || secondiRimanenti <= 0) return;

        // Decrements the counter each second for visual fluency
        const timer = setInterval(() => {
            setSecondiRimanenti((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [item.status, secondiRimanenti]);

    // Formats the remaining duration in minutes and seconds
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
            {/* Shows the number of the ticket assigned by the atomic container of the database */}
            <span className="relative z-10 text-3xl font-black text-slate-800 tracking-tighter">
                #{item.ticket}
            </span>

            {/* Visualizes the time details only if the ticket belongs to the logged user */}
            {isUser && (
                <div className="relative z-10 flex flex-col items-end animate-in fade-in duration-300">
                    <span className="text-[10px] font-bold text-slate-400 uppercase leading-none tracking-widest">
                        {item.status === 'serving' ? 'Tuo Turno' : 'Arrivo Stimato'}
                    </span>
                    <span className="text-xl font-mono font-bold text-indigo-600">
                        {/* Manages the 'serving' state as visual priority */}
                        {item.status === 'serving' ? "ORA" : formattaTempo(secondiRimanenti)}
                    </span>
                </div>
            )}

            {/* Optional visual indicator for the tickets while pending the other users */}
            {!isUser && item.status === 'serving' && (
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">
                    In Servizio
                </span>
            )}
        </div>
    );
}