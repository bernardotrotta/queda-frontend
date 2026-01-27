"use client";

import { useSearchParams } from "next/navigation";
import { useRef } from "react";
import TicketScalabile from "@/components/Wrapper";

export default function PaginaUtente() {
    // Inizializza lo strumento per leggere i parametri dell'URL"
    const searchParams = useSearchParams();
    // Cerca il valore associato alla chiave "coda"
    const codiceCoda = searchParams.get("coda");

    // Lista simulata
    const scrollContainerRef = useRef(null);
    const numeriInCoda = [38, 39, 40, 41, 42, 43, 44, 45, 46];
    const mioNumero = 42;

    return (
        <div className="min-h-screen bg-slate-200 flex flex-col items-center">
            <header className="w-full p-8 bg-slate-50 flex items-center justify-center">
                <h1 className="text-2xl text-slate-700 font-bold"> Titolo Coda</h1>
            </header>

            {/* Contenitore Principale della Lista */}
            <main className="relative grow w-full flex flex-row items-center justify-center">

                <div className="mx-[10%] w-fit flex flex-col items-center">
                    <span className="font-black text-center text-slate-700 bold text-xl">Numero Corrente:</span>
                    <span className="font-black text-slate-700 text-9xl">00</span>
                </div>

                <div className="w-[520px] flex flex-col">
                    {/* Effetto fade in alto e in basso */}
                    <div className="absolute top-0 w-auto h-[25%] bg-linear-to-b from-slate-200 to-transparent z-10 pointer-events-none" />
                    <div className="absolute bottom-0 w-auto h-[25%] bg-linear-to-t from-slate-200 to-transparent z-10 pointer-events-none" />

                    {/* Lista Scorrevole */}
                    <div ref={scrollContainerRef} className="w-full h-[80vh] overflow-y-scroll snap-y snap-mandatory no-scrollbar py-[40vh]">
                        {numeriInCoda.map((num) => (
                            <div
                                key={num}
                                className="snap-center h-20 flex items-center justify-center transition-transform duration-500"
                            >
                                {/* L'applicazione riutilizza il componente TicketCoda */}
                                <TicketScalabile
                                    numero={num}
                                    isUser={num === mioNumero}
                                    tempoInizialeMinuti={10}
                                    containerRef={scrollContainerRef}
                                />
                            </div>
                        ))}
                    </div>
                </div>

            </main>
        </div>
    );
}