"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import TicketScalabile from "@/components/Wrapper";
import { jwtDecode } from "jwt-decode";
import { QueueItem, Queue } from "@/types/queue";
import Link from "next/link";

export default function PaginaUtente() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const codiceCoda = searchParams.get("coda");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<QueueItem[]>([]);
  const [mioItem, setMioItem] = useState<QueueItem | null>(null);
  const [nomeCoda, setNomeCoda] = useState("Caricamento...");
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [numeroCorrente, setNumeroCorrente] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUser({ username: decoded.username });
      } catch (e) {
        console.error("Sessione non valida");
      }
    }

    const fetchInformazioniCoda = async () => {
      try {
        // Recupera la lista di tutte le code per trovare il nome di quella corrente
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues`);
        const data = await response.json();

        if (response.ok) {
          // Cerca la corrispondenza dell'ID nel payload
          const codaTrovata = data.payload.find((q: Queue) => q._id === codiceCoda);
          if (codaTrovata) setNomeCoda(codaTrovata.name);
        }
      } catch (error) {
        console.error("Errore nel recupero del nome coda:", error);
      }
    };

    const fetchDatiTicket = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${codiceCoda}/items`
        );
        const data = await response.json();

        if (response.ok) {
          const listaTicket: QueueItem[] = data.payload || [];
          const ticketAttivi = listaTicket.filter(i => i.status !== 'served');
          setItems(ticketAttivi);

          const inServizio = listaTicket.find(item => item.status === 'serving');
          setNumeroCorrente(inServizio ? inServizio.ticket : (listaTicket[0]?.ticket || 0));

          const token = localStorage.getItem("token");
          if (token) {
            const decoded: any = jwtDecode(token);
            const trovato = listaTicket.find(
              (item: QueueItem) => item.payload?.userId === decoded.id
            );
            if (trovato) setMioItem(trovato);
          }
        }
      } catch (error) {
        console.error("Errore aggiornamento ticket:", error);
      } finally {
        setLoading(false);
      }
    };

    if (codiceCoda) {
      fetchInformazioniCoda();
      fetchDatiTicket();
      const interval = setInterval(fetchDatiTicket, 5000);
      return () => clearInterval(interval);
    }
  }, [codiceCoda]);

  const handleAbbandonaCoda = async () => {
    if (!confirm("Vuoi davvero abbandonare la coda? Il tuo ticket verrà annullato.")) return;

    // Nota: Il backend attuale non ha un endpoint DELETE specifico per il singolo Item.
    // Si consiglia di aggiungerlo o di usare un PATCH per cambiare lo stato in 'served' prematuramente.
    // Per ora, simuliamo l'uscita tornando alla home.
    router.push("/");
  };

  useEffect(() => {
    if (mioItem && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const index = items.findIndex(i => i._id === mioItem._id);
      if (index !== -1) {
        const scrollAmount = index * 128;
        container.scrollTo({ top: scrollAmount, behavior: "smooth" });
      }
    }
  }, [mioItem, items]);

  if (loading) return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center font-black text-indigo-600">
      CARICAMENTO...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center">
      {/* Header con nome coda dinamico e link Account */}
      <header className="w-full px-8 py-4 bg-white flex items-center justify-between shadow-sm border-b-2 border-slate-100">
        <h1 className="text-xl text-indigo-600 font-black uppercase tracking-tighter">
          {nomeCoda}
        </h1>

        {user && (
          <Link href="/account">
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 hover:border-indigo-500 transition-all">
              <span className="text-slate-600 font-bold text-sm">{user.username}</span>
              <div className="size-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs text-indigo-600 font-black">
                {user.username[0].toUpperCase()}
              </div>
            </div>
          </Link>
        )}
      </header>

      <main className="relative grow w-full flex flex-col md:flex-row items-center justify-center overflow-hidden p-8">
        <div className="mx-[5%] w-fit flex flex-col items-center mb-8 md:mb-0">
          <span className="font-black text-slate-700 uppercase text-sm mb-2 opacity-50">Ora Servito:</span>
          <div className="size-48 bg-white rounded-full flex items-center justify-center border-8 border-indigo-500 shadow-2xl">
            <span className="text-7xl font-black text-indigo-600">
              {numeroCorrente.toString().padStart(2, "0")}
            </span>
          </div>

          {mioItem && (
            <div className="mt-8 flex flex-col items-center">
              <div className="text-center bg-indigo-600 p-6 rounded-3xl shadow-xl border-4 border-white">
                <p className="text-indigo-100 font-bold text-xs uppercase mb-1">Il Tuo Turno:</p>
                <p className="text-5xl font-black text-white">#{mioItem.ticket}</p>
              </div>

              <button
                onClick={handleAbbandonaCoda}
                className="mt-6 text-slate-400 font-bold text-xs uppercase hover:text-red-500 transition-colors"
              >
                Abbandona Coda
              </button>
            </div>
          )}
        </div>

        <div className="w-full max-w-lg relative h-[60vh] md:h-[80vh]">
          {/* Sfumature per enfatizzare la profondità (Verticale) */}
          <div className="absolute top-0 w-full h-32 bg-linear-to-b from-slate-200 to-transparent z-20 pointer-events-none" />
          <div className="absolute bottom-0 w-full h-32 bg-linear-to-t from-slate-200 to-transparent z-20 pointer-events-none" />

          <div
            ref={scrollContainerRef}
            className="w-full h-full flex flex-col items-center overflow-y-scroll snap-y snap-mandatory no-scrollbar py-[25vh] md:py-[35vh]"
          >
            {items.map((item) => (
              <TicketScalabile
                key={item._id}
                item={item}
                isUser={item._id === mioItem?._id}
                containerRef={scrollContainerRef}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}