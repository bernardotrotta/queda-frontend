"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QueueItem } from "@/types/queue";

export default function DashboardOrganizzatore() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const idCoda = searchParams.get("coda");

    const [items, setItems] = useState<QueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Recupera la lista completa degli elementi della coda dal backend
    const fetchCoda = async () => {
        try {
            // Interroga l'endpoint per ottenere tutti i ticket associati alla coda
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${idCoda}/items`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Impossibile caricare i dati della coda");
            }

            // Estrae la lista dal payload della risposta SuccessMessage
            setItems(data.payload || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!idCoda) {
            router.push("/account");
            return;
        }
        fetchCoda();
        // Imposta un polling per mantenere la lista aggiornata
        const interval = setInterval(fetchCoda, 5000);
        return () => clearInterval(interval);
    }, [idCoda]);

    // Gestisce il passaggio al prossimo utente tramite transazione sul backend
    const handleProssimoUtente = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            // Esegue una richiesta PATCH per aggiornare gli stati dei ticket
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${idCoda}/items`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`, // Invia il token per l'autorizzazione dell'owner
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Errore durante l'avanzamento della coda");
            }

            // Aggiorna immediatamente i dati locali dopo l'operazione
            await fetchCoda();
        } catch (err: any) {
            alert(err.message);
        }
    };

    // Filtra gli utenti in base allo stato definito nel modello
    const utentiInAttesa = items.filter(item => item.status === 'waiting');
    const utenteInServizio = items.find(item => item.status === 'serving');

    if (loading) return <div className="min-h-screen bg-slate-100 flex items-center justify-center font-bold">CARICAMENTO...</div>;

    return (
        <main className="min-h-screen bg-slate-100 p-8 flex flex-col items-center">
            {/* Header con Codice Sessione e Stato */}
            <div className="w-full max-w-4xl bg-white rounded-3xl p-8 shadow-lg mb-8 flex justify-between items-center border-b-4 border-indigo-500">
                <div>
                    <h1 className="text-sm font-black text-slate-500 uppercase tracking-widest">Codice Coda</h1>
                    <p className="text-5xl font-mono font-black text-indigo-600">
                        {idCoda?.slice(-6).toUpperCase()}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-400 uppercase">In Attesa</p>
                    <p className="text-4xl font-black text-slate-700">{utentiInAttesa.length}</p>
                </div>
            </div>

            {error && <p className="mb-4 text-red-500 font-bold">{error}</p>}

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Colonna Comandi e Stato Attuale */}
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-3xl shadow-md text-center border-2 border-indigo-50">
                        <p className="text-xs font-black text-slate-400 uppercase mb-2">Ora Servito</p>
                        <p className="text-6xl font-black text-indigo-600">
                            {utenteInServizio ? `#${utenteInServizio.ticket}` : "--"}
                        </p>
                    </div>

                    <button
                        onClick={handleProssimoUtente}
                        disabled={utentiInAttesa.length === 0}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-8 rounded-3xl shadow-xl transition-all transform active:scale-95 disabled:opacity-50 disabled:grayscale"
                    >
                        CHIAMA PROSSIMO
                    </button>
                    
                    <button 
                        onClick={() => router.push("/account")}
                        className="w-full bg-white text-slate-500 border-2 border-slate-100 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all"
                    >
                        Torna all'Account
                    </button>
                </div>

                {/* Colonna Lista Anteprima Utenti in Waiting */}
                <div className="md:col-span-2 bg-white rounded-3xl p-6 shadow-md overflow-hidden">
                    <h2 className="text-lg font-bold text-slate-700 mb-4 px-2 uppercase tracking-tight">Prossimi in lista</h2>
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
                        {utentiInAttesa.length > 0 ? (
                            utentiInAttesa.map((u) => (
                                <div key={u._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="font-bold text-slate-600">
                                        Ticket #{u.ticket} {u.payload?.username || "Utente"}
                                    </span>
                                    <span className="text-xs font-mono text-slate-400">
                                        {new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-slate-400 py-10 italic">Nessun utente in attesa</p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}