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

    // Recupera i dati della coda e i relativi ticket dal backend
    const fetchCoda = async () => {
        try {
            // Interroga l'endpoint degli items definito nel router del backend
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${idCoda}/items`);
            const data = await response.json();

            if (!response.ok) {
                // Sfrutta il messaggio di errore dinamico inviato dal middleware
                throw new Error(data.error || "Impossibile caricare i dati della coda");
            }

            // Estrae la lista dal payload della SuccessMessage
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
        // Imposta l'aggiornamento automatico ogni 5 secondi
        const interval = setInterval(fetchCoda, 5000);
        return () => clearInterval(interval);
    }, [idCoda]);

    const handleProssimoUtente = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            // Esegue l'avanzamento della coda tramite PATCH
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${idCoda}/items`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`, // Header richiesto dal middleware auth
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Errore durante l'avanzamento");

            await fetchCoda();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleEliminaCoda = async () => {
        // conferma nativa del browser

        const confirm = window.confirm("Sei sicuro di voler eliminare definitivamente questa coda?")
        if (!confirm) {
            return;
        }


        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            // Invia la richiesta di rimozione totale al backend
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${idCoda}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();

            if (!response.ok) {
                // Gestisce errori come "You must be the owner"
                throw new Error(data.error || "Errore durante l'eliminazione");
            }

            alert("Coda eliminata con successo.");
            router.push("/account");
        } catch (err: any) {
            alert(err.message);
        }
    };

    const utentiInAttesa = items.filter(item => item.status === 'waiting');
    const utenteInServizio = items.find(item => item.status === 'serving');

    if (loading) return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center font-bold text-indigo-600 animate-pulse">
            CARICAMENTO...
        </div>
    );

    return (
        <main className="min-h-screen bg-slate-100 p-8 flex flex-col items-center">
            {/* Header con Codice Sessione */}
            <div className="w-full max-w-4xl bg-white rounded-3xl p-8 shadow-lg mb-8 flex justify-between items-center border-b-4 border-indigo-500">
                <div>
                    <h1 className="text-sm font-black text-slate-500 uppercase tracking-widest">Codice Coda</h1>
                    <p className="text-xl font-mono font-black text-indigo-600 uppercase">
                        {idCoda?.toUpperCase()}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-400 uppercase">In Attesa</p>
                    <p className="text-4xl font-black text-slate-700">{utentiInAttesa.length}</p>
                </div>
            </div>

            {error && <p className="mb-4 text-red-500 font-bold bg-red-50 px-4 py-2 rounded-xl">{error}</p>}

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
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

                    {/* Pulsante collegato alla funzione di eliminazione */}
                    <button
                        onClick={handleEliminaCoda}
                        className="w-full bg-white text-red-500 border-2 border-red-100 font-bold py-4 rounded-2xl hover:bg-red-50 transition-all uppercase text-sm"
                    >
                        Elimina Coda
                    </button>

                    <button
                        onClick={() => router.push("/account")}
                        className="w-full bg-slate-50 text-slate-400 font-bold py-2 rounded-xl hover:text-slate-600 transition-all text-xs uppercase"
                    >
                        Torna all'Account
                    </button>
                </div>

                <div className="md:col-span-2 bg-white rounded-3xl p-6 shadow-md overflow-hidden">
                    <h2 className="text-lg font-bold text-slate-700 mb-4 px-2 uppercase tracking-tight">Prossimi in lista</h2>
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
                        {utentiInAttesa.length > 0 ? (
                            utentiInAttesa.map((u) => (
                                <div key={u._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="font-black text-indigo-600 text-lg">#{u.ticket}</span>
                                        {/* Estrae il nome utente salvato nel payload durante l'operazione di enqueue */}
                                        <span className="font-bold text-slate-600 lowercase opacity-80">
                                            @{u.payload?.username || "anonimo"}
                                        </span>
                                    </div>
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