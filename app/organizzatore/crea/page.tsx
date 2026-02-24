"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreaCoda() {
  const [nomeCoda, setNomeCoda] = useState("");
  const [tempoStimatoMinuti, setTempoStimatoMinuti] = useState(10); // Valore predefinito in minuti
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSalvaCoda = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      // Converte i minuti inseriti dall'utente in millisecondi per il backend
      const servingTimeEstimationMs = tempoStimatoMinuti * 60 * 1000;

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: nomeCoda,
          servingTimeEstimationMs: servingTimeEstimationMs // Invia il campo richiesto dal controller
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Impossibile creare la coda");
      }

      router.push("/account");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-200 flex items-center justify-center p-8">
      <form
        onSubmit={handleSalvaCoda}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 border border-slate-100"
      >
        <h1 className="text-3xl font-black text-indigo-600 mb-8 text-center uppercase tracking-tighter">
          Configura Coda
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold text-center border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block px-4 text-sm font-bold text-slate-700 mb-2 tracking-wide uppercase">
              Nome Sessione
            </label>
            <input
              required
              type="text"
              className="w-full p-4 bg-slate-100 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none text-slate-700 transition-all font-mono"
              placeholder="Es: Ufficio Studenti"
              value={nomeCoda}
              onChange={(e) => setNomeCoda(e.target.value)}
            />
          </div>

          <div>
            <label className="block px-4 text-sm font-bold text-slate-700 mb-2 tracking-wide uppercase">
              Durata media turno (Minuti)
            </label>
            <input
              required
              type="number"
              min="1"
              className="w-full p-4 bg-slate-100 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none text-slate-700 transition-all font-mono"
              value={tempoStimatoMinuti}
              onChange={(e) => setTempoStimatoMinuti(parseInt(e.target.value))}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            {loading ? "CREAZIONE IN CORSO..." : "SALVA E AVVIA"}
          </button>
        </div>
      </form>
    </main>
  );
}