"use client";

import { useEffect, useRef, useState, RefObject } from "react";
import { QueueItem } from "@/types/queue";
import TicketCoda from "@/components/TicketCoda";

interface WrapperProps {
    item: QueueItem;
    isUser: boolean;
    containerRef: RefObject<HTMLDivElement | null>;
    tempoAttesaTotaleMs: number; // Riceve la stima temporale dal componente PaginaUtente
}

export default function TicketScalabile({ item, isUser, containerRef, tempoAttesaTotaleMs }: WrapperProps) {
    const elementRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.8);
    const [opacity, setOpacity] = useState(0.3);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (!elementRef.current) return;
            const containerRect = container.getBoundingClientRect();
            const containerCenter = containerRect.top + containerRect.height / 2;
            const elementRect = elementRef.current.getBoundingClientRect();
            const elementCenter = elementRect.top + elementRect.height / 2;
            const distance = Math.abs(containerCenter - elementCenter);

            // Calcola la scala in base alla vicinanza dell'elemento al centro del contenitore
            const newScale = Math.max(0.7, 1.1 - distance / 400);
            setScale(newScale);

            // Applica l'opacità piena solo quando l'elemento è focalizzato al centro
            setOpacity(newScale > 0.98 ? 1 : 0.3);
        };

        // Ascolta l'evento di scroll del contenitore per aggiornare le trasformazioni
        container.addEventListener("scroll", handleScroll);
        handleScroll();
        return () => container.removeEventListener("scroll", handleScroll);
    }, [containerRef]);

    return (
        <div
            ref={elementRef}
            // Definisce l'area di snap e la transizione fluida per lo scaling visivo
            className="snap-center w-full flex items-center justify-center transition-all duration-100 shrink-0 h-12 my-6"
            style={{ 
                transform: `scale(${scale})`, 
                opacity: opacity 
            }}
        >
            <div className="w-full max-w-sm px-4">
                {/* Trasmette i dati e la stima temporale al componente grafico del ticket */}
                <TicketCoda 
                    item={item} 
                    isUser={isUser} 
                    tempoAttesaTotaleMs={tempoAttesaTotaleMs}
                />
            </div>
        </div>
    );
}