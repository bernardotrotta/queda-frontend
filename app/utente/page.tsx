"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useRef, useState, useEffect, useCallback } from "react";
import TicketScalabile from "@/components/Wrapper";
import { jwtDecode } from "jwt-decode";
import { QueueItem, Queue } from "@/types/queue";
import { io } from "socket.io-client";
import Link from "next/link";

export default function PaginaUtente() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const codiceCoda = searchParams.get("coda");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<QueueItem[]>([]);
  const [mioItem, setMioItem] = useState<QueueItem | null>(null);
  const [nomeCoda, setNomeCoda] = useState("Caricamento...");
  const [user, setUser] = useState<{ username: string; id: string } | null>(null);
  const [numeroCorrente, setNumeroCorrente] = useState(0);
  const [tempoAttesa, setTempoAttesa] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Recupera i dati e ordina la lista in modo crescente (numeri bassi in cima)
  const fetchDatiTicket = useCallback(async (userId?: string) => {
    try {
      // Interroga l'endpoint degli elementi della coda
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${codiceCoda}/items`);
      const data = await response.json();

      if (response.ok) {
        // Estrae la lista dal payload annidato del controller
        const listaTicket: QueueItem[] = data.payload?.payload?.items || [];
        
        // Filtra i ticket attivi e li ordina in modo crescente (es: 1, 2, 3...)
        const ticketAttivi = listaTicket
          .filter(i => i.status !== 'served' && i.status !== 'quit')
          .sort((a, b) => a.ticket - b.ticket);
          
        setItems(ticketAttivi);

        // Individua il numero attualmente servito o il primo disponibile in lista
        const inServizio = listaTicket.find(item => item.status === 'serving');
        setNumeroCorrente(inServizio ? inServizio.ticket : (ticketAttivi[0]?.ticket || 0));

        if (userId) {
          const trovato = listaTicket.find((item: QueueItem) => item.userId === userId);
          if (trovato) {
            setMioItem(trovato);
            // Richiede la stima d'attesa aggiornata al servizio dedicato
            const resWait = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/items/${trovato._id}/waitingTime`);
            const dataWait = await resWait.json();
            if (resWait.ok) setTempoAttesa(dataWait.payload?.['estimated time'] || 0);
          }
        }
      }
    } catch (error) {
      console.error("Errore aggiornamento:", error);
    } finally {
      setLoading(false);
    }
  }, [codiceCoda]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    let currentUserId = "";

    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUser({ username: decoded.username, id: decoded.id });
        currentUserId = decoded.id;
      } catch (e) { console.error("Sessione non valida"); }
    }

    const fetchInformazioniCoda = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues`);
        const data = await response.json();
        if (response.ok) {
          const listaCode = data.payload?.queues || [];
          const codaTrovata = listaCode.find((q: Queue) => q._id === codiceCoda);
          if (codaTrovata) setNomeCoda(codaTrovata.name);
        }
      } catch (error) { console.error("Errore recupero coda:", error); }
    };

    if (codiceCoda) {
      fetchInformazioniCoda();
      fetchDatiTicket(currentUserId);

      // Gestisce gli aggiornamenti in tempo reale tramite WebSocket
      const socket = io(process.env.NEXT_PUBLIC_BACKEND_URI!);
      socket.on("message", () => fetchDatiTicket(currentUserId));
      
      const interval = setInterval(() => fetchDatiTicket(currentUserId), 10000);
      return () => { clearInterval(interval); socket.disconnect(); };
    }
  }, [codiceCoda, fetchDatiTicket]);

  // Posiziona automaticamente lo scroll sul ticket dell'utente loggato
  useEffect(() => {
    if (mioItem && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const index = items.findIndex(i => i._id === mioItem._id);
      if (index !== -1) {
        // Calcola lo spostamento verticale in base alla posizione nell'array
        const scrollAmount = index * 128; 
        container.scrollTo({ top: scrollAmount, behavior: "smooth" });
      }
    }
  }, [mioItem, items]);

  if (loading) return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center font-black text-indigo-600 uppercase">
      Caricamento...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center">
      <header className="w-full px-8 py-4 bg-white flex items-center justify-between shadow-sm border-b-2 border-slate-100">
        <h1 className="text-xl text-indigo-600 font-black uppercase tracking-tighter">{nomeCoda}</h1>
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
          <span className="font-black text-slate-700 uppercase text-sm mb-2 opacity-50 tracking-widest">Ora Servito:</span>
          <div className="size-48 bg-white rounded-full flex items-center justify-center border-8 border-indigo-500 shadow-2xl">
            <span className="text-7xl font-black text-indigo-600">
              {numeroCorrente.toString().padStart(2, "0")}
            </span>
          </div>

          {mioItem && (
            <div className="mt-8 flex flex-col items-center animate-in fade-in zoom-in duration-500">
              <div className="text-center bg-indigo-600 p-6 rounded-3xl shadow-xl border-4 border-white">
                <p className="text-indigo-100 font-bold text-xs uppercase mb-1 tracking-tighter">Il Tuo Turno:</p>
                <p className="text-5xl font-black text-white tracking-tighter">#{mioItem.ticket}</p>
              </div>
              <button onClick={() => router.push("/")} className="mt-6 text-slate-400 font-bold text-[10px] uppercase hover:text-red-500 transition-colors tracking-widest">
                Abbandona Coda
              </button>
            </div>
          )}
        </div>

        <div className="w-full max-w-lg relative h-[60vh] md:h-[80vh]">
          <div className="absolute top-0 w-full h-32 bg-linear-to-b from-slate-200 to-transparent z-20 pointer-events-none" />
          <div className="absolute bottom-0 w-full h-32 bg-linear-to-t from-slate-200 to-transparent z-20 pointer-events-none" />

          <div
            ref={scrollContainerRef}
            className="w-full h-full flex flex-col items-center overflow-y-scroll snap-y snap-mandatory no-scrollbar py-[25vh] md:py-[35vh]"
          >
            {/* Mappa i ticket nell'ordine cronologico standard */}
            {items.map((item) => (
              <TicketScalabile
                key={item._id}
                item={item}
                isUser={item._id === mioItem?._id}
                containerRef={scrollContainerRef}
                tempoAttesaTotaleMs={item._id === mioItem?._id ? tempoAttesa : 0}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}