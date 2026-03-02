"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";

export default function Home() {
  const [codiceCoda, setCodiceCoda] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ username: string; id: string } | null>(null);
  const [erroreCoda, setErroreCoda] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verifica la presenza di una sessione attiva al caricamento
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setIsLoggedIn(true);
        setUser({ username: decoded.username, id: decoded.id });
      } catch (e) {
        // Rimuove il token se risulta corrotto o scaduto
        localStorage.removeItem("token");
      }
    }
  }, []);

  const partecipaAllaCoda = async () => {
    setLoading(true);
    setErroreCoda("");

    const token = localStorage.getItem("token");
    if (!token || !isLoggedIn) {
      setErroreCoda("Effettua il login per partecipare alla coda.");
      setLoading(false);
      return;
    }

    try {
      // Recupera la lista dei ticket per verificare se l'utente è già presente
      const resCheck = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${codiceCoda}/items`);
      const dataCheck = await resCheck.json();

      if (!resCheck.ok) throw new Error(dataCheck.error || "Codice coda non trovato.");

      // Accede al payload annidato a causa del doppio wrapping nel controller
      const listaTicket = dataCheck.payload?.payload?.items || [];
      
      // Cerca un ticket attivo associato all'ID dell'utente loggato
      const ticketEsistente = listaTicket.find((item: any) => 
        item.userId === user?.id && item.status !== 'served'
      );

      // Reindirizza direttamente se l'utente possiede già un ticket valido
      if (ticketEsistente) {
        router.push(`/utente?coda=${codiceCoda}`);
        return;
      }

      // Invia la richiesta di accodamento delegando al server la gestione del ticket
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${codiceCoda}/items`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Invia il token per l'estrazione dell'ID utente nel middleware
        },
        body: JSON.stringify({
          // Inserisce lo username nel payload Mixed del modello Item
          payload: { username: user?.username }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Errore durante l'iscrizione alla coda.");

      // Naviga alla pagina utente una volta confermata l'operazione atomica
      router.push(`/utente?coda=${codiceCoda}`);
    } catch (err: any) {
      setErroreCoda(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center">
      <header className="flex justify-end w-full px-8 py-4">
        {isLoggedIn ? (
          <Link href="/account" className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border-2 border-slate-100">
            <span className="text-slate-700 font-bold">{user?.username}</span>
            <div className="size-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs text-indigo-600 font-black">
              {user?.username?.[0].toUpperCase()}
            </div>
          </Link>
        ) : (
          <Link href="/login">
            <button className="px-8 bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
              Accedi
            </button>
          </Link>
        )}
      </header>

      <main className="grow flex flex-col items-center py-8 px-8 w-full">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-12 border border-slate-100">
          <h1 className="text-4xl font-black text-center text-indigo-600 mb-12 uppercase tracking-tighter">QUEDA</h1>

          <div className="mb-4">
            <label className="block px-4 uppercase text-sm font-bold text-slate-700 mb-2 tracking-wide">Codice Sessione</label>
            <input
              type="text"
              placeholder="Inserisci ID Coda"
              value={codiceCoda}
              className={`w-full p-4 bg-slate-100 rounded-2xl text-slate-700 border-2 outline-none transition-all font-mono ${erroreCoda ? "border-red-500" : "border-transparent focus:border-indigo-500"}`}
              onChange={(e) => setCodiceCoda(e.target.value)}
            />
            {erroreCoda && <p className="text-red-500 text-xs mt-2 px-4 font-bold">{erroreCoda}</p>}

            <button
              onClick={partecipaAllaCoda}
              disabled={!codiceCoda || loading}
              className="w-full mt-4 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Partecipa come Utente"}
            </button>
          </div>

          <div className="relative flex py-5 items-center">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-4 text-slate-400 text-sm font-bold uppercase">Oppure</span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          <Link href={isLoggedIn ? "/organizzatore/crea" : "/login"}>
            <button className="w-full border-2 border-slate-200 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all">
              Crea una Nuova Coda
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}