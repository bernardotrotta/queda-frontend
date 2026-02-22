"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";

export default function AccountPage() {
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      // Reindirizza al login se il token è assente
      router.push("/login");
      return;
    }

    try {
      // Decodifica il token per ottenere ID e username
      const decoded: any = jwtDecode(token);
      setUser({ id: decoded.id, username: decoded.username });

      // Recupera le code associate all'utente
      const fetchQueues = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URI}/users/${decoded.id}/queues`,
            {
              headers: {
                Authorization: `Bearer ${token}`, // Invia il token per l'autenticazione
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            setQueues(data.queues || []); // Imposta la lista delle code ricevute
          }
        } catch (error) {
          console.error("Errore nel recupero delle code:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchQueues();
    } catch (e) {
      // Rimuove il token se non è valido e torna al login
      localStorage.removeItem("token");
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    // Elimina il token e resetta lo stato
    localStorage.removeItem("token");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-200 flex items-center justify-center">
        <p className="text-indigo-600 font-bold animate-pulse">CARICAMENTO...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-200 p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        {/* Header Profilo */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 flex flex-col md:flex-row justify-between items-center border-b-4 border-indigo-500">
          <div className="flex items-center gap-6 mb-4 md:mb-0">
            <div className="size-20 bg-indigo-100 rounded-full flex items-center justify-center text-3xl text-indigo-600 font-black">
              {user?.username[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-700">{user?.username}</h1>
              <p className="text-slate-400 font-mono text-sm">ID: {user?.id}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all"
          >
            Logout
          </button>
        </div>

        {/* Lista Code Personali */}
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
              queues.map((q: any) => (
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