"use client";

import { useEffect, useRef, useState, RefObject } from "react";
import { QueueItem } from "@/types/queue";
import TicketCoda from "@/components/TicketCoda";

interface WrapperProps {
    item: QueueItem;
    isUser: boolean;
    containerRef: RefObject<HTMLDivElement | null>;
}

export default function TicketScalabile({ item, isUser, containerRef }: WrapperProps) {
    const elementRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.8);
    const [opacity, setOpacity] = useState(0.3); // Parte da una bassa visibilità

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

            // Calcola la scala in base alla vicinanza al centro
            const newScale = Math.max(0.7, 1.1 - distance / 400);
            setScale(newScale);

            // Applica l'opacità piena solo se l'elemento è molto vicino al centro (scala > 0.98)
            setOpacity(newScale > 0.98 ? 1 : 0.3);
        };

        container.addEventListener("scroll", handleScroll);
        handleScroll();
        return () => container.removeEventListener("scroll", handleScroll);
    }, [containerRef]);

    return (
        <div
            ref={elementRef}
            /* Aggiunge 'my-6' per creare distanza verticale tra i ticket */
            className="snap-center w-full flex items-center justify-center transition-all duration-100 shrink-0 h-12 my-6"
            style={{ 
                transform: `scale(${scale})`, 
                opacity: opacity 
            }}
        >
            <div className="w-full max-w-sm px-4">
                <TicketCoda item={item} isUser={isUser} />
            </div>
        </div>
    );
}