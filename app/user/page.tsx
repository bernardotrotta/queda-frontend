"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useRef, useState, useEffect, useCallback, Suspense } from "react";
import ScalableTicket from "@/components/Wrapper";
import { jwtDecode } from "jwt-decode";
import { QueueItem } from "@/types/queue";
import { io } from "socket.io-client";
import Link from "next/link";

/**
 * Manages the main logic of the user page, including ticket visualization
 * and the waiting time calculation
 */
function UserPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queueCode = searchParams.get("queueCode");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<QueueItem[]>([]);
  const [myItem, setMyItem] = useState<QueueItem | null>(null);
  const [queueName, setQueueName] = useState("Loading...");
  const [user, setUser] = useState<{ username: string; id: string } | null>(null);
  const [currentNumber, setCurrentNumber] = useState(0);
  const [waitingTime, setWaitingTime] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  /**
   * Recovers queue data and updates the user position
   */
  const fetchTicketData = useCallback(async (userId?: string) => {
    try {
      // The application calls the backend to obtain the ticket list
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${queueCode}/items`);
      const data = await response.json();

      if (response.ok) {
        // Extracts the ticket list from the server-nested payload
        const ticketList: QueueItem[] = data.payload?.payload?.items || [];
        
        // Filters the active tickets excluding who has been served or has come out
        const activeTickets = ticketList
          .filter(i => i.status !== 'served' && i.status !== 'quit')
          .sort((a, b) => a.ticket - b.ticket);
          
        setItems(activeTickets);

        // Identifies the ticket currently in service
        const inService = ticketList.find(item => item.status === 'serving');
        setCurrentNumber(inService ? inService.ticket : (activeTickets[0]?.ticket || 0));

        // Links the ticket to the user and calculates the estimated waiting time
        if (userId) {
          const found = ticketList.find((item: QueueItem) => item.userId === userId && item.status !== 'quit');
          if (found) {
            setMyItem(found);
            
            // Requests the waiting time based on the mean calculated by the backend
            const resWait = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/items/${found._id}/waitingTime`);
            const dataWait = await resWait.json();
            
            if (resWait.ok) {
              setWaitingTime(dataWait.payload?.['estimated time'] || 0);
            }
          } else {
            setMyItem(null);
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  }, [queueCode]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    let currentUserId = "";

    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUser({ username: decoded.username, id: decoded.id });
        currentUserId = decoded.id;
      } catch (e) {
        console.error("Invalid token");
      }
    }

    const fetchQueueInfo = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${queueCode}`);
        const data = await response.json();
        if (response.ok) setQueueName(data.payload?.queue?.name || "Queue");
      } catch (err) {
        console.error("Error fetching queue info:", err);
      }
    };

    if (queueCode) {
      fetchQueueInfo();
      fetchTicketData(currentUserId);

      // Manages the updates in real time using WebSocket
      const socket = io(process.env.NEXT_PUBLIC_BACKEND_URI!);
      socket.on("message", () => {
        fetchTicketData(currentUserId);
      });

      return () => { socket.disconnect(); };
    }
  }, [queueCode, fetchTicketData]);

  /**
   * Sends the request to abandon the queue and updates the state in the DB
   */
  const handleLeaveQueue = async () => {
    if (!myItem) return;
    if (!confirm("Do you really want to leave? Your position will be lost.")) return;

    const token = localStorage.getItem("token");
    try {
      // Calls the DELETE endpoint to set the state to 'quit'
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URI}/queues/${queueCode}/items/${myItem._id}`, 
        {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error("Error while leaving");
      router.replace("/");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center">
      <header className="w-full px-8 py-4 bg-white flex items-center justify-between shadow-sm border-b-2">
        <h1 className="text-xl text-indigo-600 font-black uppercase italic tracking-tighter">
          {queueName}
        </h1>
        {user && (
          <Link href="/account">
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border hover:border-indigo-500 cursor-pointer transition-all">
              <span className="text-slate-600 font-bold text-sm">{user.username}</span>
              <div className="size-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs text-indigo-600 font-black">
                {user.username[0].toUpperCase()}
              </div>
            </div>
          </Link>
        )}
      </header>

      <main className="grow w-full flex flex-col md:flex-row items-center justify-center p-8 overflow-hidden">
        <div className="mx-[5%] flex flex-col items-center mb-8 md:mb-0">
          <span className="font-black text-slate-400 uppercase text-xs mb-2 tracking-widest">Now Serving</span>
          <div className="size-48 bg-white rounded-full flex items-center justify-center border-8 border-indigo-500 shadow-2xl">
            <span className="text-7xl font-black text-indigo-600">
              {currentNumber.toString().padStart(2, "0")}
            </span>
          </div>

          {myItem && (
            <div className="mt-8 flex flex-col items-center animate-in zoom-in duration-500">
              <div className="text-center bg-indigo-600 p-6 rounded-3xl shadow-xl border-4 border-white">
                <p className="text-indigo-100 font-bold text-[10px] uppercase mb-1 tracking-widest">Your Turn</p>
                <p className="text-5xl font-black text-white tracking-tighter">#{myItem.ticket}</p>
              </div>
              <button
                onClick={handleLeaveQueue}
                className="mt-6 text-slate-400 font-bold text-[10px] uppercase hover:text-red-500 tracking-widest transition-colors"
              >
                Leave Queue
              </button>
            </div>
          )}
        </div>

        <div className="w-full max-w-lg relative h-[60vh] md:h-[80vh]">
          <div className="absolute top-0 w-full h-32 bg-linear-to-b from-slate-200 z-10 pointer-events-none" />
          <div className="absolute bottom-0 w-full h-32 bg-linear-to-t from-slate-200 z-10 pointer-events-none" />

          <div
            ref={scrollContainerRef}
            className="w-full h-full flex flex-col items-center overflow-y-scroll no-scrollbar py-[30vh]"
          >
            {items.map((item) => (
              <ScalableTicket
                key={item._id}
                item={item}
                isUser={item._id === myItem?._id}
                containerRef={scrollContainerRef}
                totalWaitTimeMs={item._id === myItem?._id ? waitingTime : 0}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Exports the page wrapped in a Suspense Boundary to support the pre-rendering of Next.js
 */
export default function UserPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-200 flex items-center justify-center font-black text-indigo-600 uppercase tracking-widest">
        Loading...
      </div>
    }>
      <UserPageContent />
    </Suspense>
  );
}
