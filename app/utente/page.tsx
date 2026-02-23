"use client";

import { useSearchParams } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import TicketScalabile from "@/components/Wrapper";
import { jwtDecode } from "jwt-decode";
import { QueueItem } from "@/types/queue";

export default function PaginaUtente() {
  const searchParams = useSearchParams();
  const codiceCoda = searchParams.get("coda");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Gestisce lo stato della lista dei ticket e le informazioni della sessione
  const [items, setItems] = useState<QueueItem[]>([]);
  const [mioItem, setMioItem] = useState<QueueItem | null>(null);
  const [numeroCorrente, setNumeroCorrente] = useState(0);

  useEffect(() => {
    // Recupera l'identità dell'utente dal token memorizzato localmente
    const token = localStorage.getItem("token");
    let userIdDalToken = "";

    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        userIdDalToken = decoded.id;
      } catch (e) {
        console.error("Token non valido");
      }
    }

    const fetchDatiCoda = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${codiceCoda}/items`);
        const data = await response.json();

        if (!response.ok) {
          // Sfrutta il messaggio del backend se la coda è inesistente
          throw new Error(data.error || "Coda non disponibile");
        }

        const listaTicket = data.payload || []; //
        setItems(listaTicket);
        // ... (restante logica di setNumeroCorrente e setMioItem)
      } catch (error: any) {
        console.error(error.message);
      }
    };

    if (codiceCoda) {
      fetchDatiCoda();
      // Imposta un intervallo per aggiornare la posizione automaticamente
      const interval = setInterval(fetchDatiCoda, 5000);
      return () => clearInterval(interval);
    }
  }, [codiceCoda]);

  // Esegue lo scorrimento automatico verso il ticket dell'utente quando viene caricato
  useEffect(() => {
    if (mioItem && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const index = items.findIndex(i => i._id === mioItem._id);
      if (index !== -1) {
        const scrollAmount = index * 128; // 128px corrisponde all'altezza h-32 del wrapper
        container.scrollTo({ top: scrollAmount, behavior: "smooth" });
      }
    }
  }, [mioItem, items]);

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center">
      <header className="w-full p-8 bg-slate-50 flex items-center justify-center shadow-sm">
        <h1 className="text-2xl text-slate-700 font-bold uppercase tracking-widest">
          Stato della Coda
        </h1>
      </header>

      <main className="relative grow w-full flex flex-col md:flex-row items-center justify-center overflow-hidden">
        {/* Sezione Informativa: Stato corrente */}
        <div className="mx-[5%] w-fit flex flex-col items-center mb-8 md:mb-0">
          <span className="font-black text-center text-slate-700 uppercase text-xl mb-2">
            Ora Servito:
          </span>
          <div className="size-48 bg-white rounded-full flex items-center justify-center border-8 border-indigo-500 shadow-2xl">
            <span className="text-7xl font-black text-indigo-600">
              {numeroCorrente.toString().padStart(2, "0")}
            </span>
          </div>
          {mioItem && (
            <div className="mt-8 text-center bg-indigo-100 p-4 rounded-2xl border-2 border-indigo-200">
              <p className="text-slate-600 font-bold">Il Tuo Ticket:</p>
              <p className="text-4xl font-black text-indigo-700">
                #{mioItem.ticket}
              </p>
            </div>
          )}
        </div>

        {/* Sezione Interattiva: Visualizzazione Ticket */}
        <div className="w-full max-w-lg relative h-[60vh] md:h-[80vh]">
          {/* Applica sfumature per l'effetto profondità della lista */}
          <div className="absolute top-0 w-full h-32 bg-linear-to-b from-slate-200 to-transparent z-20 pointer-events-none" />
          <div className="absolute bottom-0 w-full h-32 bg-linear-to-t from-slate-200 to-transparent z-20 pointer-events-none" />

          <div
            ref={scrollContainerRef}
            className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar py-[25vh] md:py-[35vh]"
          >
            {items.map((item) => (
              <TicketScalabile
                key={item._id}
                item={item}
                isUser={item._id === mioItem?._id}
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