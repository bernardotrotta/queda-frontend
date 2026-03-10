"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import { io } from "socket.io-client";
import { Queue, QueueItem } from "@/types/queue";
import Link from "next/link";

/**
 * Gestisce la visualizzazione e l'avanzamento della coda per l'organizzatore.
 */
function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idCoda = searchParams.get("coda");

  const [queue, setQueue] = useState<Queue | null>(null);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Recupera i dettagli della coda e la lista aggiornata dei ticket.
   */
  const fetchDati = useCallback(async () => {
    if (!idCoda) return;
    const token = localStorage.getItem("token");

    try {
      const headers = { "Authorization": `Bearer ${token}` };

      // L'applicazione recupera le info della coda
      const queueRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${idCoda}`, { headers });
      const queueData = await queueRes.json();
      
      // Il sistema scarica tutti i ticket associati alla coda
      const itemsRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${idCoda}/items`, { headers });
      const itemsData = await itemsRes.json();

      if (queueRes.ok && itemsRes.ok) {
        setQueue(queueData.payload.queue);
        // L'applicazione accede alla lista tramite il doppio payload del backend
        setItems(itemsData.payload?.payload?.items || []);
      }
    } catch (err) {
      console.error("Errore nel caricamento dati dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [idCoda]);

  useEffect(() => {
    fetchDati();

    // Il sistema stabilisce la connessione WebSocket per reagire agli eventi in tempo reale
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URI!);
    socket.on("message", () => {
      fetchDati();
    });

    return () => { socket.disconnect(); };
  }, [fetchDati]);

  /**
   * Avanza la coda al numero successivo e notifica gli utenti.
   */
  const handleProssimo = async () => {
    const token = localStorage.getItem("token");
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URI!);

    try {
      // L'applicazione richiede il dequeue del prossimo utente in attesa
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${idCoda}/items`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Nessun utente in attesa o errore server");

      // Il sistema emette un segnale broadcast per aggiornare i tempi di attesa dei client
      socket.emit("message", "update");
      fetchDati();
    } catch (err: any) {
      alert(err.message);
    } finally {
      socket.disconnect();
    }
  };

  // Filtra gli utenti ignorando chi è già stato servito o chi ha abbandonato la coda
  const inAttesa = items.filter(i => i.status === 'waiting');
  const inServizio = items.find(i => i.status === 'serving');

  if (loading) return <div className="p-12 text-center animate-pulse font-bold text-indigo-600">Sincronizzazione...</div>;

  return (
    <main className="min-h-screen bg-slate-100 p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic">
              {queue?.name}
            </h1>
            <p className="text-slate-400 font-mono text-xs">ID CODA: {idCoda}</p>
          </div>
          <Link href="/account">
            <button className="px-6 py-2 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:border-indigo-500 transition-all text-xs uppercase">
              Esci
            </button>
          </Link>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Colonna: Stato Corrente */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border-b-8 border-indigo-600 text-center">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">In Servizio</h2>
              {inServizio ? (
                <div className="animate-in zoom-in duration-300">
                  <span className="text-8xl font-black text-indigo-600 tracking-tighter">
                    #{inServizio.ticket}
                  </span>
                  <p className="mt-4 text-slate-500 font-bold text-sm uppercase">
                    ID Utente: {inServizio.userId.slice(-6).toUpperCase()}
                  </p>
                </div>
              ) : (
                <span className="text-4xl font-black text-slate-200 uppercase italic">Libero</span>
              )}
            </div>

            <button
              onClick={handleProssimo}
              disabled={inAttesa.length === 0}
              className="w-full py-6 bg-indigo-600 text-white font-black text-xl rounded-[2rem] shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale uppercase tracking-tighter"
            >
              Chiama Prossimo
            </button>
          </div>

          {/* Colonna: Lista Attesa */}
          <div className="bg-white p-8 rounded-[2rem] shadow-xl">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Prossimi in fila ({inAttesa.length})</h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {inAttesa.length > 0 ? (
                inAttesa.sort((a,b) => a.ticket - b.ticket).map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
                    <span className="font-black text-slate-700 text-lg">#{item.ticket}</span>
                    <span className="text-[10px] font-mono text-slate-400">{item.userId.slice(-6).toUpperCase()}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-300 italic text-sm">Coda vuota</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * Avvolge il contenuto della dashboard in un Suspense Boundary per gestire useSearchParams durante il build di Next.js.
 */
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-200 flex items-center justify-center font-black text-indigo-600 uppercase tracking-widest">
        Inizializzazione Dashboard...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
