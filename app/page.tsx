"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";

export default function Home() {
  const [queueCode, setQueueCode] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ username: string; id: string } | null>(null);
  const [queueError, setQueueError] = useState("");
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

  const joinQueue = async () => {
    setLoading(true);
    setQueueError("");

    const token = localStorage.getItem("token");
    if (!token || !isLoggedIn) {
      setQueueError("Please log in to join the queue.");
      setLoading(false);
      return;
    }

    try {
      const resCheck = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${queueCode}/items`);
      const dataCheck = await resCheck.json();

      // Extracts the list of the double payload of the backend
      const list = dataCheck.payload?.payload?.items || [];

      // Considers the 'waiting' and the 'serving' tickets as active
      const activeTicket = list.find((i: any) =>
        i.userId === user?.id && (i.status === 'waiting' || i.status === 'serving')
      );

      if (activeTicket) {
        router.push(`/user?queueCode=${queueCode}`);
        return;
      }

      // Sends the request of the queuing, delegating the ticket management to the server
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${queueCode}/items`, {
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
      if (!response.ok) throw new Error(data.error || "Error while joining the queue.");

      // Navigates to the user page once confirmed the atomic operation
      router.push(`/user?queueCode=${queueCode}`);
    } catch (err: any) {
      setQueueError(err.message);
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
              Login
            </button>
          </Link>
        )}
      </header>

      <main className="grow flex flex-col items-center py-8 px-8 w-full">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-12 border border-slate-100 font-sans">
          <h1 className="text-5xl font-black text-center text-indigo-600 mb-8 uppercase tracking-tighter">QUEDA</h1>

          <div className="mb-4">
            <label className="block px-4 uppercase text-[12px] font-bold text-slate-400 mb-2 tracking-wide">Session Code</label>
            <input
              type="text"
              placeholder="Enter Queue ID"
              value={queueCode}
              className={`w-full p-4 bg-slate-100 rounded-2xl text-slate-700 border-2 outline-none transition-all font-mono ${queueError ? "border-red-500" : "border-transparent focus:border-indigo-500"}`}
              onChange={(e) => setQueueCode(e.target.value)}
            />
            {queueError && <p className="text-red-500 text-xs mt-2 px-4 font-bold">{queueError}</p>}

            <button
              onClick={joinQueue}
              disabled={!queueCode || loading}
              className="w-full mt-4 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? "Joining..." : "Join as User"}
            </button>
          </div>

          <div className="relative flex py-5 items-center">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-4 text-slate-400 text-sm font-bold uppercase">Or</span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          <Link href={isLoggedIn ? "/organizer/create" : "/login"}>
            <button className="w-full border-2 border-slate-200 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all">
              Create a New Queue
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
