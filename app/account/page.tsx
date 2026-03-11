"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Queue, QueueItem } from "@/types/queue";

interface UserInfo {
  _id: string;
  email: string;
  username: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [participations, setParticipations] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingType, setEditingType] = useState<"none" | "username" | "password">("none");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: ""
  });

  const router = useRouter();

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      const userRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/users/me`, { headers });
      const userData = await userRes.json();
      if (!userRes.ok) throw new Error(userData.error || "Errore profilo");

      const queuesRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/users/me/queues`, { headers });
      const queuesData = await queuesRes.json();
      if (!queuesRes.ok) throw new Error(queuesData.error || "Errore code create");

      const itemsRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/users/me/queues/items`, { headers });
      const itemsData = await itemsRes.json();

      if (itemsRes.ok) {
        // Filters explicitly excluding both 'served' and 'quit' to show only active tickets
        const activeTickets = (itemsData.payload.items || []).filter(
          (item: QueueItem) => item.status === 'waiting' || item.status === 'serving'
        );
        setParticipations(activeTickets);
      }
      
      setUser(userData.payload.user);
      setQueues(queuesData.payload.queues || []);

    } catch (error: any) {
      console.error("Errore recupero dati:", error.message);
      localStorage.removeItem("token");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      // Sends all the necessary parameters to satisfy the backend validators
      // If modifying only the username, sends fake passwords which will be ignored by the controller thanks to the 'type' field
      const payload = {
        username: editingType === "username" ? formData.username : (user?.username || ""),
        password: editingType === "password" ? formData.password : "123",
        confirmPassword: editingType === "password" ? formData.confirmPassword : "123",
        type: editingType
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/users/me`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Errore aggiornamento");

      alert("Modifica completata con successo");
      setEditingType("none");
      setFormData({ username: "", password: "", confirmPassword: "" });

      // Refreshes data to update the user interface
      if (editingType === "username") {
          window.location.reload();
      } else {
          fetchData();
      }

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
      "ATTENZIONE: Questa azione eliminerà permanentemente il tuo profilo e tutte le tue code. Procedere?"
    );
    if (!confirmDelete) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/users/me`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Impossibile eliminare l'account");
      handleLogout();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center font-bold text-indigo-600 animate-pulse uppercase tracking-widest">
      Caricamento profilo...
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-200 p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-8">
        <div className="bg-white rounded-3xl p-8 shadow-xl border-b-4 border-indigo-500">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="flex items-center gap-6 mb-4 md:mb-0">
              <div className="size-20 bg-indigo-100 rounded-full flex items-center justify-center text-3xl text-indigo-600 font-black shadow-inner">
                {user?.username?.[0].toUpperCase() || "?"}
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-700">{user?.username}</h1>
                <p className="text-slate-400 font-mono text-xs">Email: {user?.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => setEditingType("username")} className="px-4 py-2 border-2 border-indigo-100 text-indigo-600 text-xs font-bold rounded-xl hover:bg-indigo-50 transition-all uppercase">Nome</button>
              <button onClick={() => setEditingType("password")} className="px-4 py-2 border-2 border-indigo-100 text-indigo-600 text-xs font-bold rounded-xl hover:bg-indigo-50 transition-all uppercase">Password</button>
              <button onClick={handleLogout} className="px-4 py-2 bg-red-50 text-red-600 font-bold text-xs rounded-xl hover:bg-red-100 transition-all uppercase">Logout</button>
            </div>
          </div>

          {editingType !== "none" && (
            <form onSubmit={handleUpdateInfo} className="mt-6 p-6 bg-slate-50 rounded-2xl border-2 border-indigo-100 animate-in fade-in slide-in-from-top-4 duration-300">
              <h3 className="text-sm font-black text-indigo-600 uppercase mb-4 tracking-tighter">
                Modifica {editingType === "username" ? "Username" : "Password"}
              </h3>
              <div className="grid gap-4">
                {editingType === "username" ? (
                  <input
                    type="text"
                    required
                    placeholder="Inserisci nuovo nome"
                    className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-mono text-slate-600"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                ) : (
                  <>
                    <input
                      type="password"
                      required
                      placeholder="Nuova Password"
                      className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-mono text-slate-600"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <input
                      type="password"
                      required
                      placeholder="Conferma Password"
                      className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-mono text-slate-600"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </>
                )}
                <div className="flex gap-2">
                  <button type="submit" className="grow bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all text-xs uppercase">Salva</button>
                  <button type="button" onClick={() => setEditingType("none")} className="px-6 py-3 bg-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-300 transition-all text-xs uppercase">Annulla</button>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <h2 className="text-xl font-black text-slate-700 uppercase tracking-tight mb-8">Partecipazioni Attive</h2>
          <div className="grid gap-4">
            {participations.length > 0 ? (
              participations.map((item) => (
                <div key={item._id} className="flex items-center justify-between p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <div className="flex items-center gap-4">
                    <span className="text-indigo-600 font-black text-2xl">#{item.ticket}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.status}</p>
                      <p className="text-[10px] text-slate-300 font-mono">ID: {item.queueId.slice(-6).toUpperCase()}</p>
                    </div>
                  </div>
                  <Link href={`/utente?coda=${item.queueId}`}>
                    <button className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all uppercase">Vai al Turno</button>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-center py-10 text-slate-400 italic">Non sei attualmente in attesa in nessuna coda.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-slate-700 uppercase tracking-tight">Le Tue Code (Admin)</h2>
            <Link href="/organizzatore/crea">
              <button className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all uppercase">+ Crea</button>
            </Link>
          </div>
          <div className="grid gap-4">
            {queues.length > 0 ? (
              queues.map((q) => (
                <div key={q._id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                  <div>
                    <h3 className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{q.name}</h3>
                    <p className="text-xs text-slate-400 font-mono uppercase mt-1">Codice: {q._id.toUpperCase()}</p>
                  </div>
                  <Link href={`/organizzatore/dashboard?coda=${q._id}`}>
                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all uppercase">Dashboard</button>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-center py-10 text-slate-400 italic">Non hai ancora creato alcuna sessione.</p>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center px-4">
          <Link href="/" className="text-slate-500 font-bold hover:text-indigo-600 transition-all text-sm uppercase">← Home</Link>
          <button onClick={handleDeleteAccount} className="text-red-300 font-bold hover:text-red-500 transition-all text-[10px] uppercase tracking-widest">Elimina Account</button>
        </div>
      </div>
    </main>
  );
}