"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Queue } from "@/types/queue";

interface UserInfo {
  _id: string;
  email: string;
  username: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Gestisce la visibilità e i dati dei moduli di modifica
  const [editingType, setEditingType] = useState<"none" | "username" | "password">("none");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: ""
  });
  
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const headers = { 
            "Authorization": `Bearer ${token}`, 
            "Content-Type": "application/json" 
        };

        // Recupera il profilo utente dal payload della SuccessMessage
        const userRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/users/me`, { headers });
        const userData = await userRes.json();
        if (!userRes.ok) throw new Error(userData.error || "Errore nel recupero profilo");

        // Recupera le code associate all'utente
        const queuesRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/users/me/queues`, { headers });
        const queuesData = await queuesRes.json();
        if (!queuesRes.ok) throw new Error(queuesData.error || "Errore nel recupero code");

        // Estrae i dati dai payload strutturati del backend
        setUser(userData.payload.user); 
        setQueues(Array.isArray(queuesData.payload.queues) ? queuesData.payload.queues : []);
      } catch (error: any) {
        console.error(error.message);
        localStorage.removeItem("token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    try {
      // Invia la richiesta PATCH con il tipo di operazione specifica
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/users/me`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          type: editingType // 'username' o 'password'
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Errore durante l'aggiornamento");

      alert("Dati aggiornati con successo");
      setEditingType("none");
      // Resetta i campi del modulo
      setFormData({ username: "", password: "", confirmPassword: "" });
      
      // Forza il ricaricamento dei dati se è stato cambiato lo username
      if (editingType === "username") window.location.reload();
      
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Sei sicuro? Questa azione eliminerà permanentemente il tuo profilo e tutte le tue code."
    );
    if (!confirmDelete) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/users/me`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Impossibile eliminare l'account");
      }

      handleLogout();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center font-bold text-indigo-600 animate-pulse uppercase tracking-widest">
      Caricamento...
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-200 p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        {/* Header Profilo e Impostazioni */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 border-b-4 border-indigo-500">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="flex items-center gap-6 mb-4 md:mb-0">
              <div className="size-20 bg-indigo-100 rounded-full flex items-center justify-center text-3xl text-indigo-600 font-black shadow-inner">
                {user?.username?.[0].toUpperCase() || "?"}
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-700">{user?.username}</h1>
                <p className="text-slate-400 font-mono text-xs">ID: {user?._id}</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setEditingType(editingType === "username" ? "none" : "username")}
                className="px-4 py-2 border-2 border-indigo-100 text-indigo-600 text-xs font-bold rounded-xl hover:bg-indigo-50 transition-all uppercase"
              >
                Cambia Nome
              </button>
              <button
                onClick={() => setEditingType(editingType === "password" ? "none" : "password")}
                className="px-4 py-2 border-2 border-indigo-100 text-indigo-600 text-xs font-bold rounded-xl hover:bg-indigo-50 transition-all uppercase"
              >
                Cambia Password
              </button>
              <button onClick={handleLogout} className="px-4 py-2 bg-red-50 text-red-600 font-bold text-xs rounded-xl hover:bg-red-100 transition-all uppercase">
                Logout
              </button>
            </div>
          </div>

          {/* Form di modifica dinamico */}
          {editingType !== "none" && (
            <form onSubmit={handleUpdateInfo} className="mt-6 p-6 bg-slate-50 rounded-2xl border-2 border-indigo-100 animate-in fade-in slide-in-from-top-4 duration-300">
              <h3 className="text-sm font-black text-indigo-600 uppercase mb-4 tracking-tighter">
                Modifica {editingType === "username" ? "Nome Utente" : "Password"}
              </h3>
              <div className="grid gap-4">
                {editingType === "username" ? (
                  <input
                    type="text"
                    required
                    placeholder="Nuovo Username"
                    className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-mono"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                ) : (
                  <>
                    <input
                      type="password"
                      required
                      placeholder="Nuova Password"
                      className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-mono"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <input
                      type="password"
                      required
                      placeholder="Conferma Password"
                      className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-mono"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </>
                )}
                <div className="flex gap-2">
                  <button type="submit" className="grow bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all text-xs uppercase">
                    Salva Modifiche
                  </button>
                  <button type="button" onClick={() => setEditingType("none")} className="px-6 py-3 bg-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-300 transition-all text-xs uppercase">
                    Annulla
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Gestione Code */}
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-slate-700 uppercase tracking-tight">Le Tue Code</h2>
            <Link href="/organizzatore/crea">
              <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all">+ Nuova Coda</button>
            </Link>
          </div>

          <div className="grid gap-4">
            {queues.length > 0 ? (
              queues.map((q) => (
                <div key={q._id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                  <div>
                    <h3 className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{q.name}</h3>
                    <p className="text-xs text-slate-400 font-mono uppercase mt-1">Codice: {q._id.slice(-6).toUpperCase()}</p>
                  </div>
                  <Link href={`/organizzatore/dashboard?coda=${q._id}`}>
                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all">Gestisci</button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 italic">Non hai ancora creato nessuna coda.</div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center">
          <Link href="/" className="text-slate-500 font-bold hover:text-indigo-600 transition-all text-sm uppercase">← Home</Link>
          <button onClick={handleDeleteAccount} className="text-red-300 font-bold hover:text-red-500 transition-all text-[10px] uppercase tracking-widest">Elimina Account</button>
        </div>
      </div>
    </main>
  );
}