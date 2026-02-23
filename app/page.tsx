"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

export default function Home() {
  const [codiceCoda, setCodiceCoda] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [erroreCoda, setErroreCoda] = useState("");
  const [user, setUser] = useState<{ username: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Recupera il token dal localStorage per verificare la sessione
    const token = localStorage.getItem("token");

    if (token) {
      setIsLoggedIn(true);
      try {
        // Estrae le informazioni dell'utente dal payload del JWT
        const decoded: any = jwtDecode(token);
        setUser({ username: decoded.username });
      } catch (e) {
        // Rimuove il token se risulta corrotto o scaduto
        localStorage.removeItem("token");
        setIsLoggedIn(false);
      }
    }
  }, []);

  // ... (import invariati)
  const gestisciPartecipazione = async () => {
    setErroreCoda("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${codiceCoda}/items`);
      const data = await response.json();

      if (!response.ok) {
        // Estrae il messaggio 'error' inviato dal middleware o usa un fallback
        throw new Error(data.error || "ID Coda non trovato o non valido");
      }
      router.push(`/utente?coda=${codiceCoda}`);
    } catch (err: any) {
      setErroreCoda(err.message);
    }
  };
  // ...

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center">
      <header className="flex justify-end w-full px-8 py-4">
        {isLoggedIn ? (
          <Link href="/account" className="group">
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border-2 border-slate-100 hover:border-indigo-500 transition-all">
              <span className="text-slate-700 font-bold">{user?.username}</span>
              {/* Avatar testuale coerente con la pagina account */}
              <div className="size-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs text-indigo-600 font-black">
                {user?.username?.[0].toUpperCase()}
              </div>
            </div>
          </Link>
        ) : (
          <Link href="/login" className="group">
            <button className="px-8 bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
              Accedi
            </button>
          </Link>
        )}
      </header>

      <main className="grow flex flex-col items-center py-8 px-8 w-full">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-12 border border-slate-100 shrink-0">
          <h1 className="text-4xl font-black text-center text-indigo-600 mb-12 uppercase tracking-tighter">
            QUEDA
          </h1>

          <div className="mb-4">
            <label className="block px-4 uppercase text-sm font-bold text-slate-700 mb-2 tracking-wide">
              Codice Sessione
            </label>
            <input
              type="text"
              placeholder="Inserisci ID Coda"
              value={codiceCoda}
              className={`w-full p-4 bg-slate-100 rounded-2xl text-slate-700 border-2 outline-none transition-all font-mono ${erroreCoda
                ? "border-red-500"
                : "border-transparent focus:border-indigo-500"
                }`}
              onChange={(e) => setCodiceCoda(e.target.value)}
            />

            <div className="min-h-5">
              {erroreCoda && (
                <p className="text-red-500 text-xs mt-2 px-4 font-bold leading-tight">
                  {erroreCoda}
                </p>
              )}
            </div>

            <button
              onClick={gestisciPartecipazione}
              disabled={!codiceCoda}
              className="w-full mt-4 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
            >
              Partecipa come Utente
            </button>
          </div>

          <div className="relative flex py-5 items-center">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-4 text-slate-400 text-sm font-bold uppercase">
              Oppure
            </span>
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