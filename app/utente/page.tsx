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

  /**
   * L'applicazione aggiorna i dati della coda e calcola il tempo di attesa specifico.
   */
  const fetchDatiTicket = useCallback(async (userId?: string) => {
    try {
      // Il sistema interroga l'endpoint degli elementi della coda
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${codiceCoda}/items`);
      const data = await response.json();

      if (response.ok) {
        // L'applicazione accede alla lista tramite il doppio payload del controller
        const listaTicket: QueueItem[] = data.payload?.payload?.items || [];
        
        // Il sistema filtra i ticket attivi e li ordina in modo crescente
        const ticketAttivi = listaTicket
          .filter(i => i.status !== 'served' && i.status !== 'quit')
          .sort((a, b) => a.ticket - b.ticket);
          
        setItems(ticketAttivi);

        // L'applicazione individua il numero attualmente in fase di servizio
        const inServizio = listaTicket.find(item => item.status === 'serving');
        setNumeroCorrente(inServizio ? inServizio.ticket : (ticketAttivi[0]?.ticket || 0));

        // Il sistema identifica il ticket dell'utente loggato e ne recupera la stima temporale
        if (userId) {
          const trovato = listaTicket.find((item: QueueItem) => item.userId === userId && item.status !== 'quit');
          if (trovato) {
            setMioItem(trovato);
            
            // L'applicazione richiede il tempo stimato basato sulla media e sul tempo trascorso
            const resWait = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/items/${trovato._id}/waitingTime`);
            const dataWait = await resWait.json();
            
            if (resWait.ok) {
              // Il sistema memorizza il tempo (in ms) per il countdown locale
              setTempoAttesa(dataWait.payload?.['estimated time'] || 0);
            }
          } else {
            // Se l'utente non ha più un ticket attivo (es. è in 'quit'), lo riporta alla home
            setMioItem(null);
          }
        }
      }
    } catch (error) {
      console.error("Errore rinfresco ticket:", error);
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
        // L'applicazione estrae l'identità dell'utente dal JWT
        setUser({ username: decoded.username, id: decoded.id });
        currentUserId = decoded.id;
      } catch (e) {
        console.error("Sessione non valida");
      }
    }

    /**
     * Il sistema recupera i dettagli della coda per visualizzare il nome corretto.
     */
    const fetchInformazioniCoda = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${codiceCoda}`);
        const data = await response.json();
        if (response.ok) {
          // L'applicazione estrae il nome dal payload dell'oggetto coda
          setNomeCoda(data.payload?.queue?.name || "Coda");
        }
      } catch (error) {
        console.error("Errore recupero nome coda:", error);
      }
    };

    if (codiceCoda) {
      fetchInformazioniCoda();
      fetchDatiTicket(currentUserId);

      // L'applicazione stabilisce una connessione Socket.io per gli aggiornamenti real-time
      const socket = io(process.env.NEXT_PUBLIC_BACKEND_URI!);
      
      socket.on("message", () => {
        // Il sistema riesegue il fetch ogni volta che l'organizzatore avanza la coda
        fetchDatiTicket(currentUserId);
      });

      // L'applicazione esegue un polling di sicurezza ogni 10 secondi
      const interval = setInterval(() => fetchDatiTicket(currentUserId), 10000);

      return () => {
        clearInterval(interval);
        socket.disconnect();
      };
    }
  }, [codiceCoda, fetchDatiTicket]);

  /**
   * L'applicazione gestisce l'abbandono anticipato della coda.
   */
  const handleAbbandonaCoda = async () => {
    if (!mioItem) return;
    if (!confirm("Vuoi davvero abbandonare la coda? La tua posizione verrà persa.")) return;

    const token = localStorage.getItem("token");
    try {
      // Il sistema invia una richiesta DELETE per impostare lo stato del ticket su 'quit'
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${codiceCoda}/items/${mioItem._id}`, 
        {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error("Impossibile abbandonare la coda");

      // L'applicazione reindirizza l'utente alla schermata principale
      router.replace("/");
    } catch (err: any) {
      alert(err.message);
    }
  };

  /**
   * Il sistema esegue lo scroll automatico verso il ticket dell'utente.
   */
  useEffect(() => {
    if (mioItem && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const index = items.findIndex(i => i._id === mioItem._id);
      if (index !== -1) {
        // L'applicazione calcola lo scroll in base all'altezza dei ticket
        const scrollAmount = index * 128; 
        container.scrollTo({ top: scrollAmount, behavior: "smooth" });
      }
    }
  }, [mioItem, items]);

  if (loading) return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center font-black text-indigo-600 uppercase tracking-widest">
      Caricamento...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center">
      <header className="w-full px-8 py-4 bg-white flex items-center justify-between shadow-sm border-b-2 border-slate-100">
        <h1 className="text-2xl text-indigo-600 font-black uppercase tracking-tighter">
          {nomeCoda}
        </h1>

        {user && (
          <Link href="/account">
            <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 transition-all cursor-pointer">
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

              <button
                onClick={handleAbbandonaCoda}
                className="mt-6 text-slate-400 font-bold text-[10px] uppercase hover:text-red-500 transition-colors tracking-widest"
              >
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
            {/* L'applicazione renderizza la lista dei ticket ordinata dal più basso al più alto */}
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