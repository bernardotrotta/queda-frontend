"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreaCoda() {
    const [nomeCoda, setNomeCoda] = useState("");
    const [tempoMedio, setTempoMedio] = useState(10);
    const router = useRouter();

    const handleSalvaCoda = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Invia i dati al backend per inizializzare la coda
            const response = await fetch("http://localhost:5000/api/queues", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    nome: nomeCoda,
                    tempoStimato: tempoMedio,
                    users: [] // La coda nasce vuota 
                }),
            });

            if (response.ok) {
                const data = await response.json();
                router.push(`/organizzatore/dashboard?coda=${data.id}`);
            }
        } catch (error) {
            console.error("Errore nella creazione:", error);
        }
    };

    return (
        <main className="min-h-screen bg-slate-200 flex items-center justify-center p-8">
            <form onSubmit={handleSalvaCoda} className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10">
                <h1 className="text-3xl font-black text-indigo-600 mb-8 text-center uppercase">Configura Coda</h1>

                <div className="space-y-6">
                    <div>
                        <label className="block px-4 text-sm font-bold text-slate-700 mb-2 tracking-wide">Nome Sessione</label>
                        <input
                            required
                            type="text"
                            className="w-full p-4 bg-slate-100 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none"
                            placeholder="Es: Ufficio Studenti"
                            onChange={(e) => setNomeCoda(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block px-4 text-sm font-bold text-slate-700 mb-2 tracking-wide">Durata media di un turno</label>
                        <input
                            type="number"
                            className="w-full p-4 bg-slate-100 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none"
                            value={tempoMedio}
                            onChange={(e) => setTempoMedio(parseInt(e.target.value))}
                        />
                    </div>

                    <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg">
                        GENERA CODICE SESSIONE
                    </button>
                </div>
            </form>
        </main>
    );
}