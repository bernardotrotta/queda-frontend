"use client";

import { useEffect, useRef, useState, RefObject } from "react";
import { QueueItem } from "@/types/queue";
import TicketCoda from "@/components/TicketCoda";

interface WrapperProps {
    // Riceve l'oggetto del ticket dal backend per passarlo al componente figlio [cite: 1]
    item: QueueItem;
    // Identifica se l'elemento appartiene all'utente corrente
    isUser: boolean;
    // Definisce il tempo stimato per il servizio
    tempoInizialeMinuti: number;
    // Mantiene il riferimento al contenitore genitore per calcolare lo scroll
    containerRef: RefObject<HTMLDivElement | null>;
}

export default function TicketScalabile({ item, isUser, tempoInizialeMinuti, containerRef }: WrapperProps) {
    const elementRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.8); // Imposta la scala minima di partenza

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (!elementRef.current) return;

            // Calcola il centro del contenitore per determinare il punto di ingrandimento massimo
            const containerRect = container.getBoundingClientRect();
            const containerCenter = containerRect.top + containerRect.height / 2;

            // Calcola il centro del singolo ticket rispetto alla finestra
            const elementRect = elementRef.current.getBoundingClientRect();
            const elementCenter = elementRect.top + elementRect.height / 2;

            // Determina la distanza assoluta tra il ticket e il centro della vista
            const distance = Math.abs(containerCenter - elementCenter);

            // Applica una trasformazione di scala proporzionale alla vicinanza al centro
            // Incrementa la dimensione fino a un massimo di 1.1x
            const newScale = Math.max(0.7, 1.1 - distance / 400);
            setScale(newScale);
        };

        // Aggancia l'ascoltatore all'evento di scorrimento del contenitore
        container.addEventListener("scroll", handleScroll);
        // Esegue un calcolo iniziale per posizionare correttamente gli elementi al caricamento
        handleScroll();

        // Rimuove l'ascoltatore per prevenire sprechi di memoria allo smontaggio
        return () => container.removeEventListener("scroll", handleScroll);
    }, [containerRef]);

    return (
        <div
            ref={elementRef}
            className="snap-center w-full max-w-90 h-32 flex items-center justify-center transition-transform duration-75"
            style={{ 
                transform: `scale(${scale})`, 
                opacity: scale > 0.9 ? 1 : 0.5 
            }}
        >
            {/* Trasmette i dati del ticket e lo stato dell'utente al componente visuale */}
            <TicketCoda 
                item={item} 
                isUser={isUser} 
                tempoInizialeMinuti={tempoInizialeMinuti} 
            />
        </div>
    );
}