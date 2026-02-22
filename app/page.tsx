"use client"; // Abilita l'interattività lato client

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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

  const gestisciPartecipazione = async () => {
    setErroreCoda(""); // Resetta eventuali errori precedenti

    try {
      // Effettua una chiamata al backend per verificare l'esistenza della coda
      // Utilizza l'endpoint che recupera gli elementi della coda per validare l'ID
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${codiceCoda}/items`
      );

      if (!response.ok) {
        throw new Error("Codice sessione non valido o scaduto.");
      }

      // Reindirizza l'utente alla pagina della coda se la validazione ha successo
      router.push(`/utente?coda=${codiceCoda}`);
    } catch (err: any) {
      setErroreCoda(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center">
      <header className="flex justify-end w-full px-8 py-4">
        {isLoggedIn ? (
          <Link href="/account" className="group">
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border-2 border-slate-100 hover:border-indigo-500 transition-all">
              <span className="text-slate-700 font-bold">{user?.username}</span>
              <div className="relative rounded-full size-8 overflow-hidden border-indigo-500">
                <Image
                  src="/images/user.png"
                  alt="Account"
                  fill
                  className="object-cover"
                />
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

      <main className="grow flex flex-col items-center py-8 px-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-12 border border-slate-100">
          <h1 className="text-4xl font-black text-center text-indigo-600 mb-12">
            QUEDA
          </h1>

          <div className="mb-4">
            <label className="block px-4 uppercase text-sm font-bold text-slate-700 mb-2 tracking-wide">
              Inserisci Codice Coda
            </label>
            <input
              type="text"
              placeholder="ID della Coda"
              value={codiceCoda}
              className={`w-full p-4 bg-slate-100 rounded-2xl text-slate-700 border-2 outline-none transition-all font-mono ${
                erroreCoda
                  ? "border-red-500"
                  : "border-transparent focus:border-indigo-500"
              }`}
              onChange={(e) => setCodiceCoda(e.target.value)}
            />

            {erroreCoda && (
              <p className="text-red-500 text-xs mt-2 px-4 font-bold">
                {erroreCoda}
              </p>
            )}

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