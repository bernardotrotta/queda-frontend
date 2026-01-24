"use client";

import { useEffect, useRef, useState } from "react";
import TicketCoda from "@/components/TicketCoda";

export default function TicketScalabile({ numero, isUser, tempoInizialeMinuti, containerRef }: any) {
    const elementRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.8); // Scala minima di partenza

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (!elementRef.current) return;

            // Calcola il centro del contenitore
            const containerRect = container.getBoundingClientRect();
            const containerCenter = containerRect.top + containerRect.height / 2;

            // Calcola il centro del ticket
            const elementRect = elementRef.current.getBoundingClientRect();
            const elementCenter = elementRect.top + elementRect.height / 2;

            // Calcola la distanza dal centro (valore assoluto)
            const distance = Math.abs(containerCenter - elementCenter);

            // Calcolo della scala: più è vicino al centro, più si avvicina a 1.1
            // Riduce la scala man mano che la distanza aumenta
            const newScale = Math.max(0.7, 1.1 - distance / 400);
            setScale(newScale);
        };

        // Ascolta lo scroll e calcola la posizione iniziale
        container.addEventListener("scroll", handleScroll);
        handleScroll();

        return () => container.removeEventListener("scroll", handleScroll);
    }, [containerRef]);

    return (
        <div
            ref={elementRef}
            className="snap-center w-full max-w-90 h-32 flex items-center justify-center transition-transform duration-75"
            style={{ transform: `scale(${scale})`, opacity: scale > 0.9 ? 1 : 0.5 }}
        >
            <TicketCoda numero={numero} isUser={isUser} tempoInizialeMinuti={tempoInizialeMinuti} />
        </div>
    );
}