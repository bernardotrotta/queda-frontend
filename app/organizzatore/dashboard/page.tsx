"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";

export default function DashboardOrganizzatore() {
    const searchParams = useSearchParams();
    const idCoda = searchParams.get("coda");

    const [utentiInAttesa, setUtentiInAttesa] = useState<any[]>([]);
    const [codiceSessione, setCodiceSessione] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Recupera i dati iniziali della coda
        const fetchCoda = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/queues/${idCoda}`);
                const data = await response.json();

                if (response.ok) {
                    // Popola la lista con gli utenti presenti nel modello Queue
                    setUtentiInAttesa(data.users || []); // 
                    setCodiceSessione(data.codice || idCoda);
                }
            } catch (error) {
                console.error("Errore nel recupero dati:", error);
            } finally {
                setLoading(false);
            }
        };

        if (idCoda) fetchCoda();
    }, [idCoda]);

    const handleProssimoUtente = async () => {
        try {
            // Chiama il servizio dequeue per servire il primo della lista
            const response = await fetch(`http://localhost:5000/api/queues/${idCoda}/dequeue`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (response.ok) {
                // Aggiorna localmente la lista rimuovendo il primo elemento
                setUtentiInAttesa(prev => prev.slice(1)); // [cite: 2, 6]
            }
        } catch (error) {
            console.error("Errore durante il dequeue:", error);
        }
    };

    return (
        <main className="min-h-screen bg-slate-100 p-8 flex flex-col items-center">
            <h1 className="text-xl my-8 font-black text-slate-700 uppercase tracking-widest">Caricamento...</h1>
            {/* Header con Codice Sessione */}
            <div className="w-full max-w-4xl bg-white rounded-3xl p-8 shadow-lg mb-8 flex justify-between items-center border-b-4 border-indigo-500">
                <div>
                    <h1 className="text-sm font-black text-slate-500 uppercase tracking-widest">Codice Coda</h1>
                    <p className="text-5xl font-mono font-black text-indigo-600">{codiceSessione}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-400 uppercase">Utenti in Coda</p>
                    <p className="text-4xl font-black text-slate-700">{utentiInAttesa.length}</p>
                </div>
            </div>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Colonna Comandi */}
                <div className="md:col-span-1 space-y-4">
                    <button
                        onClick={handleProssimoUtente}
                        disabled={utentiInAttesa.length === 0}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-8 rounded-3xl shadow-xl transition-all transform active:scale-95 disabled:opacity-50 disabled:grayscale"
                    >
                        CHIAMA PROSSIMO
                    </button>
                    <button className="w-full bg-white text-red-500 border-2 border-red-100 font-bold py-4 rounded-2xl hover:bg-red-50 transition-all">
                        Termina Sessione
                    </button>
                </div>

                {/* Colonna Lista Anteprima */}
                <div className="md:col-span-2 bg-white rounded-3xl p-6 shadow-md overflow-hidden">
                    <h2 className="text-lg font-bold text-slate-700 mb-4 px-2">Prossimi in lista</h2>
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
                        {utentiInAttesa.length > 0 ? (
                            utentiInAttesa.map((u, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="font-bold text-slate-600">#{i + 1} {u.username}</span>
                                    <span className="text-xs font-mono text-slate-400">Arrivato: {new Date(u.createdAt).toLocaleTimeString()}</span>
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