"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Queue } from "@/types/queue";

// Rappresenta i dati anagrafici dell'utente estratti dal database
interface UserInfo {
  _id: string;
  email: string;
  username: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Recupera il token per autenticare le chiamate ai servizi protetti
    const token = localStorage.getItem("token");

    if (!token) {
      // Reindirizza al login in mancanza di una sessione valida
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

        const userRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/users/me`, { headers });
        const userData = await userRes.json();
        if (!userRes.ok) throw new Error(userData.error || "Errore nel recupero profilo");

        const queuesRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/users/me/queues`, { headers });
        const queuesData = await queuesRes.json();
        if (!queuesRes.ok) throw new Error(queuesData.error || "Errore nel recupero code");

        setUser(userData.payload); //
        setQueues(Array.isArray(queuesData.payload) ? queuesData.payload : []);
      } catch (error: any) {
        // Visualizza l'errore del backend prima di resettare la sessione
        console.error(error.message);
        localStorage.removeItem("token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    // Elimina la sessione locale e torna alla pagina principale
    localStorage.removeItem("token");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-200 flex items-center justify-center">
        <p className="text-indigo-600 font-bold animate-pulse uppercase tracking-widest">
          Caricamento...
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-200 p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        {/* Header Profilo: mostra l'iniziale del nome e l'ID univoco del database */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 flex flex-col md:flex-row justify-between items-center border-b-4 border-indigo-500">
          <div className="flex items-center gap-6 mb-4 md:mb-0">
            {/* Genera un avatar testuale basato sulla prima lettera dello username */}
            <div className="size-20 bg-indigo-100 rounded-full flex items-center justify-center text-3xl text-indigo-600 font-black">
              {user?.username?.[0].toUpperCase() || "?"}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-700">{user?.username}</h1>
              {/* Visualizza l'ID tecnico dell'utente recuperato dal backend */}
              <p className="text-slate-400 font-mono text-sm">ID: {user?._id}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all"
          >
            Logout
          </button>
        </div>

        {/* Sezione di gestione delle code personali */}
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-slate-700 uppercase tracking-tight">
              Le Tue Code
            </h2>
            <Link href="/organizzatore/crea">
              <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all">
                + Nuova Coda
              </button>
            </Link>
          </div>

          <div className="grid gap-4">
            {queues.length > 0 ? (
              queues.map((q) => (
                <div
                  key={q._id}
                  className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group"
                >
                  <div>
                    <h3 className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                      {q.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono uppercase mt-1">
                      Codice: {q._id.slice(-6).toUpperCase()}
                    </p>
                  </div>
                  <Link href={`/organizzatore/dashboard?coda=${q._id}`}>
                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all">
                      Gestisci
                    </button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400 italic">Non hai ancora creato nessuna coda.</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-slate-500 font-bold hover:text-indigo-600 transition-all">
            ← Torna alla Home
          </Link>
        </div>
      </div>
    </main>
  );
}