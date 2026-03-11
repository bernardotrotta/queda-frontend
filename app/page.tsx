"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";

export default function Home() {
  const [codiceCoda, setCodiceCoda] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ username: string; id: string } | null>(null);
  const [erroreCoda, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Checks for the presence of an active session when loading
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setIsLoggedIn(true);
        setUser({ username: decoded.username, id: decoded.id });
      } catch (e) {
        // Removes the token if it is corrupted or expired
        localStorage.removeItem("token");
      }
    }
  }, []);

  const JoinTheQueue = async () => {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    if (!token || !isLoggedIn) {
      setError("Please log in to join the queue.");
      setLoading(false);
      return;
    }

    try {
      const resCheck = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${codiceCoda}/items`);
      const dataCheck = await resCheck.json();

      // Extracts the list of the double payload of the backend
      const lista = dataCheck.payload?.payload?.items || [];

      // Considers the 'waiting' and the 'serving' tickets as active
      const ticketAttivo = lista.find((i: any) =>
        i.userId === user?.id && (i.status === 'waiting' || i.status === 'serving')
      );

      if (ticketAttivo) {
        router.push(`/user?coda=${codiceCoda}`);
        return;
      }

      // Sends the request of the queuing, delegating the ticket management to the server
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${codiceCoda}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Sends the token for the extraction of the user ID in the middleware
        },
        body: JSON.stringify({
          // Puts the username in the Mixed payload of the Item model
          payload: { username: user?.username }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Errore durante l'iscrizione alla coda.");

      // Navigates to the user page once confirmed the atomic operation
      router.push(`/utente?coda=${codiceCoda}`);
    } catch (err: any) {
      setError(err.message);
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
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-12 border border-slate-100 font-sans">
          <h1 className="text-5xl font-black text-center text-indigo-600 mb-8 uppercase tracking-tighter">QUEDA</h1>

          <div className="mb-4">
            <label className="block px-4 uppercase text-[12px] font-bold text-slate-400 mb-2 tracking-wide">Codice Sessione</label>
            <input
              type="text"
              placeholder="Inserisci ID Coda"
              value={codiceCoda}
              className={`w-full p-4 bg-slate-100 rounded-2xl text-slate-700 border-2 outline-none transition-all font-mono ${erroreCoda ? "border-red-500" : "border-transparent focus:border-indigo-500"}`}
              onChange={(e) => setCodiceCoda(e.target.value)}
            />
            {erroreCoda && <p className="text-red-500 text-xs mt-2 px-4 font-bold">{erroreCoda}</p>}

            <button
              onClick={JoinTheQueue}
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