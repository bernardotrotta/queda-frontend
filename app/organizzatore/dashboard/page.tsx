"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import { io } from "socket.io-client";
import { Queue, QueueItem } from "@/types/queue";
import Link from "next/link";

/**
 * Gestisce la visualizzazione, l'avanzamento e l'eliminazione della coda.
 */
function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idCoda = searchParams.get("coda");

  const [queue, setQueue] = useState<Queue | null>(null);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * L'applicazione recupera i dettagli della coda e la lista dei ticket dal server.
   */
  const fetchDati = useCallback(async () => {
    if (!idCoda) return;
    const token = localStorage.getItem("token");

    try {
      const headers = { "Authorization": `Bearer ${token}` };

      // Il sistema interroga gli endpoint per ottenere lo stato attuale
      const queueRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${idCoda}`, { headers });
      const queueData = await queueRes.json();
      
      const itemsRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${idCoda}/items`, { headers });
      const itemsData = await itemsRes.json();

      if (queueRes.ok && itemsRes.ok) {
        setQueue(queueData.payload.queue);
        setItems(itemsData.payload?.payload?.items || []);
      }
    } catch (err) {
      console.error("Errore sincronizzazione dati:", err);
    } finally {
      setLoading(false);
    }
  }, [idCoda]);

  useEffect(() => {
    fetchDati();

    // L'applicazione apre un canale WebSocket per aggiornamenti in tempo reale
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URI!);
    socket.on("message", () => {
      fetchDati();
    });

    return () => { socket.disconnect(); };
  }, [fetchDati]);

  /**
   * Il sistema effettua il dequeue dell'utente successivo e notifica i client.
   */
  const handleProssimo = async () => {
    const token = localStorage.getItem("token");
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URI!);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${idCoda}/items`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Nessun utente in coda");

      // L'applicazione invia un segnale di aggiornamento a tutti gli utenti
      socket.emit("message", "update");
      fetchDati();
    } catch (err: any) {
      alert(err.message);
    } finally {
      socket.disconnect();
    }
  };

  /**
   * L'applicazione richiede la cancellazione definitiva della coda al backend.
   */
  const handleEliminaCoda = async () => {
    const conferma = window.confirm("Sei sicuro di voler eliminare questa coda? Tutti i ticket verranno persi.");
    if (!conferma) return;

    const token = localStorage.getItem("token");
    try {
      // Il sistema invia una richiesta DELETE all'endpoint della coda
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${idCoda}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Errore durante l'eliminazione");

      // In caso di successo, l'applicazione reindirizza l'organizzatore al suo profilo
      router.push("/account");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const inAttesa = items.filter(i => i.status === 'waiting');
  const inServizio = items.find(i => i.status === 'serving');

  if (loading) return <div className="p-12 text-center font-bold text-indigo-600 animate-pulse">Caricamento...</div>;

  return (
    <main className="min-h-screen bg-slate-100 p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic">
              {queue?.name}
            </h1>
            <p className="text-slate-400 font-mono text-xs uppercase">ID: {idCoda?.toUpperCase()}</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleEliminaCoda}
              className="px-6 py-2 bg-red-50 text-red-600 font-bold rounded-2xl border-2 border-red-100 hover:bg-red-100 transition-all text-xs uppercase"
            >
              Elimina Coda
            </button>
            <Link href="/account">
              <button className="px-6 py-2 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:border-indigo-500 transition-all text-xs uppercase">
                Esci
              </button>
            </Link>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border-b-8 border-indigo-600 text-center">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Attualmente servito</h2>
              {inServizio ? (
                <div className="animate-in zoom-in duration-300">
                  <span className="text-8xl font-black text-indigo-600 tracking-tighter">
                    #{inServizio.ticket}
                  </span>
                  <p className="mt-4 text-slate-500 font-bold text-xs uppercase">Utente: {inServizio.userId.toUpperCase()}</p>
                </div>
              ) : (
                <span className="text-4xl font-black text-slate-200 uppercase italic">In attesa...</span>
              )}
            </div>

            <button
              onClick={handleProssimo}
              disabled={inAttesa.length === 0}
              className="w-full py-6 bg-indigo-600 text-white font-black text-xl rounded-[2rem] shadow-lg hover:bg-indigo-700 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-20 uppercase tracking-tighter"
            >
              Chiama Prossimo
            </button>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Lista d'attesa ({inAttesa.length})</h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {inAttesa.length > 0 ? (
                inAttesa.sort((a,b) => a.ticket - b.ticket).map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="font-black text-slate-700 text-lg">#{item.ticket}</span>
                    <span className="text-[10px] font-mono text-slate-400">ID: {item.userId.toUpperCase()}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-300 italic text-sm">Nessuno in fila</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * Esporta la dashboard garantendo la compatibilità con il build statico di Next.js tramite Suspense.
 */
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-200 flex items-center justify-center font-black text-indigo-600 uppercase">Sincronizzazione in corso...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
