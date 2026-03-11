"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useRef, useState, useEffect, useCallback, Suspense } from "react";
import TicketScalabile from "@/components/Wrapper";
import { jwtDecode } from "jwt-decode";
import { QueueItem } from "@/types/queue";
import { io } from "socket.io-client";
import Link from "next/link";

/**
 * Manages the  main logic of theuser page, including ticket visualization
 * and the waiting time calculation
 */
function UserPageContent() {
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

  /**
   * Recovers queue data and updates the user position
   */
  const fetchDatiTicket = useCallback(async (userId?: string) => {
    try {
      // The application calls the backend to obtain the ticket list
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${codiceCoda}/items`);
      const data = await response.json();

      if (response.ok) {
        // Extracts the ticket list from the server-nested payload
        const listaTicket: QueueItem[] = data.payload?.payload?.items || [];
        
        // Filters the active tickets excluding who has been served or has come out
        const ticketAttivi = listaTicket
          .filter(i => i.status !== 'served' && i.status !== 'quit')
          .sort((a, b) => a.ticket - b.ticket);
          
        setItems(ticketAttivi);

        // Identifies the ticket currently in service
        const inServizio = listaTicket.find(item => item.status === 'serving');
        setNumeroCorrente(inServizio ? inServizio.ticket : (ticketAttivi[0]?.ticket || 0));

        // Links the ticket to the user and calculates the estimated waiting time
        if (userId) {
          const trovato = listaTicket.find((item: QueueItem) => item.userId === userId && item.status !== 'quit');
          if (trovato) {
            setMioItem(trovato);
            
            // Requests the waiting time based on the mean calculated by the backend
            const resWait = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/items/${trovato._id}/waitingTime`);
            const dataWait = await resWait.json();
            
            if (resWait.ok) {
              setTempoAttesa(dataWait.payload?.['estimated time'] || 0);
            }
          } else {
            setMioItem(null);
          }
        }
      }
    } catch (error) {
      console.error("Errore rinfresco dati:", error);
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
      } catch (e) {
        console.error("Token non valido");
      }
    }

    const fetchInfoCoda = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${codiceCoda}`);
        const data = await response.json();
        if (response.ok) setNomeCoda(data.payload?.queue?.name || "Coda");
      } catch (err) {
        console.error("Errore info coda:", err);
      }
    };

    if (codiceCoda) {
      fetchInfoCoda();
      fetchDatiTicket(currentUserId);

      // Manages the updates in real time using WebSocket
      const socket = io(process.env.NEXT_PUBLIC_BACKEND_URI!);
      socket.on("message", () => {
        fetchDatiTicket(currentUserId);
      });

      return () => { socket.disconnect(); };
    }
  }, [codiceCoda, fetchDatiTicket]);

  /**
   * Sends the request to abandon the queue and updates the state in the DB
   */
  const handleAbbandonaCoda = async () => {
    if (!mioItem) return;
    if (!confirm("Vuoi davvero uscire? La tua posizione verrà persa.")) return;

    const token = localStorage.getItem("token");
    try {
      // Calls the DELETE endpoint to set the state to 'quit'
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${codiceCoda}/items/${mioItem._id}`, 
        {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error("Errore durante l'uscita");
      router.replace("/");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center">
      <header className="w-full px-8 py-4 bg-white flex items-center justify-between shadow-sm border-b-2">
        <h1 className="text-xl text-indigo-600 font-black uppercase italic tracking-tighter">
          {nomeCoda}
        </h1>
        {user && (
          <Link href="/account">
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border hover:border-indigo-500 cursor-pointer transition-all">
              <span className="text-slate-600 font-bold text-sm">{user.username}</span>
              <div className="size-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs text-indigo-600 font-black">
                {user.username[0].toUpperCase()}
              </div>
            </div>
          </Link>
        )}
      </header>

      <main className="grow w-full flex flex-col md:flex-row items-center justify-center p-8 overflow-hidden">
        <div className="mx-[5%] flex flex-col items-center mb-8 md:mb-0">
          <span className="font-black text-slate-400 uppercase text-xs mb-2 tracking-widest">Ora Servito</span>
          <div className="size-48 bg-white rounded-full flex items-center justify-center border-8 border-indigo-500 shadow-2xl">
            <span className="text-7xl font-black text-indigo-600">
              {numeroCorrente.toString().padStart(2, "0")}
            </span>
          </div>

          {mioItem && (
            <div className="mt-8 flex flex-col items-center animate-in zoom-in duration-500">
              <div className="text-center bg-indigo-600 p-6 rounded-3xl shadow-xl border-4 border-white">
                <p className="text-indigo-100 font-bold text-[10px] uppercase mb-1 tracking-widest">Il Tuo Turno</p>
                <p className="text-5xl font-black text-white tracking-tighter">#{mioItem.ticket}</p>
              </div>
              <button
                onClick={handleAbbandonaCoda}
                className="mt-6 text-slate-400 font-bold text-[10px] uppercase hover:text-red-500 tracking-widest transition-colors"
              >
                Abbandona Coda
              </button>
            </div>
          )}
        </div>

        <div className="w-full max-w-lg relative h-[60vh] md:h-[80vh]">
          <div className="absolute top-0 w-full h-32 bg-linear-to-b from-slate-200 z-10 pointer-events-none" />
          <div className="absolute bottom-0 w-full h-32 bg-linear-to-t from-slate-200 z-10 pointer-events-none" />

          <div
            ref={scrollContainerRef}
            className="w-full h-full flex flex-col items-center overflow-y-scroll no-scrollbar py-[30vh]"
          >
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

/**
 * Exports the page wrapped in a Suspense Boundary to support the pre-rendering of Next.js
 */
export default function PaginaUtente() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-200 flex items-center justify-center font-black text-indigo-600 uppercase tracking-widest">
        Caricamento...
      </div>
    }>
      <UserPageContent />
    </Suspense>
  );
}
