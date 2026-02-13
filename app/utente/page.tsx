"use client";

import { useSearchParams } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import TicketScalabile from "@/components/Wrapper";
import { jwtDecode } from "jwt-decode";

export default function PaginaUtente() {
    const searchParams = useSearchParams();
    const codiceCoda = searchParams.get("coda");
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Stati 
    const [numeriInCoda, setNumeriInCoda] = useState<number[]>([]);
    const [mioNumero, setMioNumero] = useState<number | null>(null);
    const [titoloCoda, setTitoloCoda] = useState("Caricamento...");
    const [numeroCorrente, setNumeroCorrente] = useState(0);

    useEffect(() => {
        // Recupera l'identità dell'utente dal token
        const token = localStorage.getItem("token");
        let usernameDalToken = "";

        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                usernameDalToken = decoded.username;
            } catch (e) {
                console.error("Token non valido");
            }
        }

        const fetchDatiCoda = async () => {
            try {
                // Interroga il servizio showQueue del backend
                const response = await fetch(`http://localhost:3000/api/queues/${codiceCoda}`);
                const data = await response.json();

                if (response.ok) {
                    setTitoloCoda(data.nome || `Coda: ${codiceCoda}`);

                    // Estrae la lista dei numeri (es. la posizione nell'array users)
                    const lista = data.users.map((u: any, index: number) => index + 1);
                    setNumeriInCoda(lista);

                    // Identifica il numero assegnato all'utente loggato
                    const indexUtente = data.users.findIndex((u: any) => u.username === usernameDalToken);
                    if (indexUtente !== -1) {
                        setMioNumero(indexUtente + 1);
                    }

                    // Imposta il numero che sta venendo servito ora
                    setNumeroCorrente(lista[0] || 0);
                }
            } catch (error) {
                console.error("Errore nel caricamento della coda:", error);
            }
        };

        if (codiceCoda) fetchDatiCoda();
    }, [codiceCoda]);

    // Gestisce lo scorrimento automatico verso il proprio ticket
    useEffect(() => {
        if (mioNumero && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const index = numeriInCoda.indexOf(mioNumero);
            if (index !== -1) {
                const scrollAmount = index * 80; // 80px è l'altezza definita nel wrapper (h-20)
                container.scrollTo({ top: scrollAmount, behavior: "smooth" });
            }
        }
    }, [mioNumero, numeriInCoda]);

    return (
        <div className="min-h-screen bg-slate-200 flex flex-col items-center">
            <header className="w-full p-8 bg-slate-50 flex items-center justify-center shadow-sm">
                <h1 className="text-2xl text-slate-700 font-bold uppercase tracking-widest">
                    {titoloCoda}
                </h1>
            </header>

            <main className="relative grow w-full flex flex-row items-center justify-center overflow-hidden">

                {/* Sezione Sinistra: Stato della Coda */}
                <div className="mx-[5%] w-fit flex flex-col items-center">
                    <span className="font-black text-center text-slate-700 uppercase text-xl mb-2">
                        Numero Corrente:
                    </span>
                    <div className="size-48 bg-white rounded-full flex items-center justify-center border-8 border-indigo-500 shadow-2xl">
                        <span className="text-7xl font-black text-indigo-600">
                            {numeroCorrente.toString().padStart(2, '0')}
                        </span>
                    </div>
                    {mioNumero && (
                        <div className="mt-8 text-center bg-indigo-100 p-4 rounded-2xl border-2 border-indigo-200">
                            <p className="text-slate-600 font-bold">Il Tuo Numero:</p>
                            <p className="text-4xl font-black text-indigo-700">#{mioNumero}</p>
                        </div>
                    )}
                </div>

                {/* Sezione Destra: Lista Scorrevole */}
                <div className="w-130 relative h-[80vh]">
                    {/* Sfumature per l'effetto profondità */}
                    <div className="absolute top-0 w-full h-32 bg-linear-to-b from-slate-200 to-transparent z-20 pointer-events-none" />
                    <div className="absolute bottom-0 w-full h-32 bg-linear-to-t from-slate-200 to-transparent z-20 pointer-events-none" />

                    <div
                        ref={scrollContainerRef}
                        className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar py-[35vh]"
                    >
                        {numeriInCoda.map((num) => (
                            <TicketScalabile
                                key={num}
                                numero={num}
                                isUser={num === mioNumero}
                                tempoInizialeMinuti={10}
                                containerRef={scrollContainerRef}
                            />
                        ))}
                    </div>
                </div>

            </main>
        </div>
    );
}