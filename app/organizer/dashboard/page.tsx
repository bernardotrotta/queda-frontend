"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import { io } from "socket.io-client";
import { Queue, QueueItem } from "@/types/queue";
import Link from "next/link";

/**
 * Manages the visualization, the progress and the elimination of the queue
 */
function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queueId = searchParams.get("queueCode");

  const [queue, setQueue] = useState<Queue | null>(null);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * The application gets the queue details and the ticket list from the server
   */
  const fetchData = useCallback(async () => {
    if (!queueId) return;
    const token = localStorage.getItem("token");

    try {
      const headers = { "Authorization": `Bearer ${token}` };

      // The system asks the endpoints to obtain the actual state
      const queueRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${queueId}`, { headers });
      const queueData = await queueRes.json();
      
      const itemsRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${queueId}/items`, { headers });
      const itemsData = await itemsRes.json();

      if (queueRes.ok && itemsRes.ok) {
        setQueue(queueData.payload.queue);
        setItems(itemsData.payload?.payload?.items || []);
      }
    } catch (err) {
      console.error("Data synchronization error:", err);
    } finally {
      setLoading(false);
    }
  }, [queueId]);

  useEffect(() => {
    fetchData();

    // The application opens a WebSocket channel for real time updates
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URI!);
    socket.on("message", () => {
      fetchData();
    });

    return () => { socket.disconnect(); };
  }, [fetchData]);

  /**
   * The system does the dequeue of the next user and notifies the clients
   */
  const handleNext = async () => {
    const token = localStorage.getItem("token");
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URI!);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${queueId}/items`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("No users in queue");

      // The application sends an update signal to all users
      socket.emit("message", "update");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      socket.disconnect();
    }
  };

  /**
   * The application requests the permanent cancellation of the queue to the backend
   */
  const handleDeleteQueue = async () => {
    const confirm = window.confirm("Are you sure you want to delete this queue? All tickets will be lost.");
    if (!confirm) return;

    const token = localStorage.getItem("token");
    try {
      // The system sends a DELETE request to the queue endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${queueId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Error during deletion");

      // In case of a success, the application redirects the organizer to his profile
      router.push("/account");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const waitingItems = items.filter(i => i.status === 'waiting');
  const servingItem = items.find(i => i.status === 'serving');

  if (loading) return <div className="p-12 text-center font-bold text-indigo-600 animate-pulse">Loading...</div>;

  return (
    <main className="min-h-screen bg-slate-100 p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic">
              {queue?.name}
            </h1>
            <p className="text-slate-400 font-mono text-xs uppercase">ID: {queueId?.toUpperCase()}</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleDeleteQueue}
              className="px-6 py-2 bg-red-50 text-red-600 font-bold rounded-2xl border-2 border-red-100 hover:bg-red-100 transition-all text-xs uppercase"
            >
              Delete Queue
            </button>
            <Link href="/account">
              <button className="px-6 py-2 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:border-indigo-500 transition-all text-xs uppercase">
                Exit
              </button>
            </Link>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-4xl shadow-xl border-b-8 border-indigo-600 text-center">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Currently serving</h2>
              {servingItem ? (
                <div className="animate-in zoom-in duration-300">
                  <span className="text-8xl font-black text-indigo-600 tracking-tighter">
                    #{servingItem.ticket}
                  </span>
                  <p className="mt-4 text-slate-500 font-bold text-xs uppercase">User: {servingItem.userId.toUpperCase()}</p>
                </div>
              ) : (
                <span className="text-4xl font-black text-slate-200 uppercase italic">Waiting...</span>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={waitingItems.length === 0}
              className="w-full py-6 bg-indigo-600 text-white font-black text-xl rounded-4xl shadow-lg hover:bg-indigo-700 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-20 uppercase tracking-tighter"
            >
              Call Next
            </button>
          </div>

          <div className="bg-white p-8 rounded-4xl shadow-xl border border-slate-100">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Waiting list ({waitingItems.length})</h2>
            <div className="space-y-3 max-h-100 overflow-y-auto pr-2 custom-scrollbar">
              {waitingItems.length > 0 ? (
                waitingItems.sort((a,b) => a.ticket - b.ticket).map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="font-black text-slate-700 text-lg">#{item.ticket}</span>
                    <span className="text-[10px] font-mono text-slate-400">ID: {item.userId.toUpperCase()}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-300 italic text-sm">No one in line</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * Exports the dashboard guaranteeing the compatibility with the static build of Next.js through Suspense.
 */
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-200 flex items-center justify-center font-black text-indigo-600 uppercase">Syncing...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
