"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";


export default function CreaCoda() {
  const [nomeCoda, setNomeCoda] = useState("");
  const [tempoMedio, setTempoMedio] = useState(10);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSalvaCoda = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Devi aver effettuato il login per creare una coda.");
      router.push("/login");
      return;
    }

    try {
      // Estrae l'ID dell'utente dal JWT per passarlo al backend
      const decoded: any = jwtDecode(token);
      const userId = decoded.id;

      // Effettua la chiamata all'endpoint del backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queue/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, 
        },
        body: JSON.stringify({
          user: userId,
          // Nota: 'name' e 'tempoMedio' sono inviati ma il backend attuale 
          // sovrascrive 'name' con un valore predefinito nel service.
          name: nomeCoda 
        }),
      });

      if (response.ok) {
        // Il backend risponde con { message: 'Created' }
        // Il backend deve restituire l'ID della nuova coda <-------------------------------------------------------------
        // attualmente reindirizza alla dashboard generale.
        router.push("/organizzatore/dashboard");
      } else {
        const errorData = await response.json();
        alert(`Errore: ${errorData.message || "Impossibile creare la coda"}`);
      }
    } catch (error) {
      console.error("Errore nella creazione della coda:", error);
      alert("Si è verificato un errore di rete.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-200 flex items-center justify-center p-8">
      <form
        onSubmit={handleSalvaCoda}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10"
      >
        <h1 className="text-3xl font-black text-indigo-600 mb-8 text-center uppercase">
          Configura Coda
        </h1>

        <div className="space-y-6">
          <div>
            <label className="block px-4 text-sm font-bold text-slate-700 mb-2 tracking-wide">
              Nome Sessione
            </label>
            <input
              required
              type="text"
              className="w-full p-4 bg-slate-100 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none text-slate-700 transition-all"
              placeholder="Es: Ufficio Studenti"
              value={nomeCoda}
              onChange={(e) => setNomeCoda(e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-1 px-4 italic">
              * Nota: Il backend attuale potrebbe rinominarla automaticamente.
            </p>
          </div>

          <div>
            <label className="block px-4 text-sm font-bold text-slate-700 mb-2 tracking-wide">
              Durata media di un turno (minuti)
            </label>
            <input
              type="number"
              className="w-full p-4 bg-slate-100 rounded-2xl border-2 border-transparent text-slate-700 focus:border-indigo-500 outline-none transition-all"
              value={tempoMedio}
              onChange={(e) => setTempoMedio(parseInt(e.target.value))}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? "CREAZIONE IN CORSO..." : "SALVA E AVVIA"}
          </button>
        </div>
      </form>
    </main>
  );
}