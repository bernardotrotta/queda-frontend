"use client";

import { useEffect, useRef, useState, RefObject } from "react";
import { QueueItem } from "@/types/queue";
import TicketQueue from "@/components/TicketQueue";

interface WrapperProps {
    item: QueueItem;
    isUser: boolean;
    containerRef: RefObject<HTMLDivElement | null>;
    tempoAttesaTotaleMs: number; // Receives a time estimate from the PaginaUtente component
}

export default function TicketScalable({ item, isUser, containerRef, tempoAttesaTotaleMs }: WrapperProps) {
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

            // Calculates the scale based on the distance from the element to the center of the container
            const newScale = Math.max(0.7, 1.1 - distance / 400);
            setScale(newScale);

            // Applies maximum opacity only when the element is focused at the center
            setOpacity(newScale > 0.98 ? 1 : 0.3);
        };

        // Listens to the scroll event of the container to update the transformations
        container.addEventListener("scroll", handleScroll);
        handleScroll();
        return () => container.removeEventListener("scroll", handleScroll);
    }, [containerRef]);

    return (
        <div
            ref={elementRef}
            // Defines the snap area and the fluid transition for the visual scaling
            className="snap-center w-full flex items-center justify-center transition-all duration-100 shrink-0 h-12 my-6"
            style={{ 
                transform: `scale(${scale})`, 
                opacity: opacity 
            }}
        >
            <div className="w-full max-w-sm px-4">
                {/* Trasmits data and the time estimate to the graphic component of the ticket */}
                <TicketQueue
                    item={item} 
                    isUser={isUser} 
                    tempoAttesaTotaleMs={tempoAttesaTotaleMs}
                />
            </div>
        </div>
    );
}